const crypto = require("crypto");
const fs = require("fs");
const {
  Dataset,
  DatasetVersion,
  ProvenanceEvent
} = require("../models");
const { sha256File } = require("../services/hashService");
const blockchain = require("../services/blockchainService");

async function createDataset(req, res) {
  let uploadedFilePath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "A CSV file is required" });
    }

    const { name, description = "", source = "", category = "General", reason = "" } = req.body;
    if (!name || !name.trim()) {
      fs.unlink(uploadedFilePath, () => {});
      return res.status(400).json({ error: "Dataset name is required" });
    }

    const datasetId = crypto.randomUUID();
    const versionId = crypto.randomUUID();
    const fileHash = await sha256File(uploadedFilePath);

    const dataset = await Dataset.create({
      datasetId,
      name: name.trim(),
      description,
      source,
      category,
      ownerId: req.user.id,
      ownerName: req.user.name,
      currentVersion: 1
    });

    const version = await DatasetVersion.create({
      datasetId: dataset._id,
      versionId,
      versionNumber: 1,
      fileName: req.file.originalname,
      storedFileName: req.file.filename,
      filePath: uploadedFilePath,
      fileSize: req.file.size,
      fileHash,
      previousVersionId: "",
      previousHash: "",
      operation: "CREATED",
      changeDescription: description || "Initial dataset upload",
      reason: reason || "Dataset registration",
      createdBy: req.user.id,
      createdByName: req.user.name,
      blockchainStatus: "pending"
    });

    const event = await ProvenanceEvent.create({
      datasetId: dataset._id,
      versionId: version._id,
      userId: req.user.id,
      userName: req.user.name,
      operation: "CREATED",
      description: version.changeDescription,
      reason: version.reason,
      fileHash,
      previousHash: "",
      blockchainStatus: "pending"
    });

    const chain = await blockchain.writeProvenance({
      datasetId: dataset.datasetId,
      versionId: version.versionId,
      operation: version.operation,
      fileHash: version.fileHash,
      previousHash: ""
    });

    version.blockchainStatus = chain.status;
    version.blockchainTxHash = chain.txHash;
    version.blockchainError = chain.error || "";
    await version.save();

    event.blockchainStatus = chain.status;
    event.blockchainTxHash = chain.txHash;
    await event.save();

    return res.status(201).json({
      dataset,
      version,
      event,
      blockchain: chain
    });
  } catch (error) {
    if (uploadedFilePath) fs.unlink(uploadedFilePath, () => {});
    return res.status(500).json({ error: error.message });
  }
}

async function listDatasets(req, res) {
  try {
    const filter = req.user.role === "auditor" ? {} : { ownerId: req.user.id };
    const datasets = await Dataset.find(filter).sort({ createdAt: -1 });

    const withVersions = await Promise.all(
      datasets.map(async (dataset) => {
        const versions = await DatasetVersion.find({ datasetId: dataset._id })
          .sort({ versionNumber: 1 })
          .select("versionId versionNumber fileHash operation blockchainStatus blockchainTxHash createdAt createdByName");
        return { ...dataset.toObject(), versions };
      })
    );

    return res.json(withVersions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getDataset(req, res) {
  try {
    const { datasetId } = req.params;
    const dataset = await Dataset.findOne({ datasetId });
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    if (req.user.role !== "auditor" && dataset.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized for this dataset" });
    }

    const versions = await DatasetVersion.find({ datasetId: dataset._id })
      .sort({ versionNumber: 1 });
    const events = await ProvenanceEvent.find({ datasetId: dataset._id })
      .sort({ createdAt: -1 });

    return res.json({
      dataset,
      versions,
      events
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function deleteDataset(req, res) {
  try {
    const { datasetId } = req.params;
    const dataset = await Dataset.findOne({ datasetId });
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    if (dataset.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the owner can delete this dataset" });
    }

    const versions = await DatasetVersion.find({ datasetId: dataset._id });
    for (const version of versions) {
      if (version.filePath) fs.unlink(version.filePath, () => {});
    }

    await DatasetVersion.deleteMany({ datasetId: dataset._id });
    await ProvenanceEvent.deleteMany({ datasetId: dataset._id });
    await Dataset.deleteOne({ _id: dataset._id });

    return res.json({ message: "Dataset deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { createDataset, listDatasets, getDataset, deleteDataset };