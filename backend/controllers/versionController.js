const crypto = require("crypto");
const fs = require("fs");
const {
  Dataset,
  DatasetVersion,
  ProvenanceEvent
} = require("../models");
const { sha256File } = require("../services/hashService");
const blockchain = require("../services/blockchainService");

const ALLOWED_OPERATIONS = [
  "UPLOADED",
  "CLEANED",
  "FILTERED",
  "TRANSFORMED",
  "MERGED",
  "UPDATED",
  "ANALYZED",
  "EXPORTED"
];

async function createVersion(req, res) {
  let uploadedFilePath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "A CSV file is required" });
    }

    const { datasetId } = req.params;
    const { operation = "UPDATED", description = "", reason = "" } = req.body;

    if (!ALLOWED_OPERATIONS.includes(operation)) {
      fs.unlink(uploadedFilePath, () => {});
      return res.status(400).json({ error: "Invalid operation" });
    }

    const dataset = await Dataset.findOne({ datasetId });
    if (!dataset) {
      fs.unlink(uploadedFilePath, () => {});
      return res.status(404).json({ error: "Dataset not found" });
    }
    if (dataset.ownerId.toString() !== req.user.id) {
      fs.unlink(uploadedFilePath, () => {});
      return res.status(403).json({ error: "Only the owner can add versions" });
    }

    const previous = await DatasetVersion.findOne({ datasetId: dataset._id })
      .sort({ versionNumber: -1 });

    const fileHash = await sha256File(uploadedFilePath);
    const nextNumber = (previous?.versionNumber || 0) + 1;

    const version = await DatasetVersion.create({
      datasetId: dataset._id,
      versionId: crypto.randomUUID(),
      versionNumber: nextNumber,
      fileName: req.file.originalname,
      storedFileName: req.file.filename,
      filePath: uploadedFilePath,
      fileSize: req.file.size,
      fileHash,
      previousVersionId: previous?.versionId || "",
      previousHash: previous?.fileHash || "",
      operation,
      changeDescription: description,
      reason,
      createdBy: req.user.id,
      createdByName: req.user.name,
      blockchainStatus: "pending"
    });

    dataset.currentVersion = nextNumber;
    await dataset.save();

    const event = await ProvenanceEvent.create({
      datasetId: dataset._id,
      versionId: version._id,
      userId: req.user.id,
      userName: req.user.name,
      operation,
      description,
      reason,
      fileHash,
      previousHash: version.previousHash,
      blockchainStatus: "pending"
    });

    const chain = await blockchain.writeProvenance({
      datasetId: dataset.datasetId,
      versionId: version.versionId,
      operation,
      fileHash,
      previousHash: version.previousHash
    });

    version.blockchainStatus = chain.status;
    version.blockchainTxHash = chain.txHash;
    version.blockchainError = chain.error || "";
    await version.save();

    event.blockchainStatus = chain.status;
    event.blockchainTxHash = chain.txHash;
    await event.save();

    return res.status(201).json({ version, event, blockchain: chain });
  } catch (error) {
    if (uploadedFilePath) fs.unlink(uploadedFilePath, () => {});
    return res.status(500).json({ error: error.message });
  }
}

async function listVersions(req, res) {
  try {
    const { datasetId } = req.params;
    const dataset = await Dataset.findOne({ datasetId });
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    if (req.user.role !== "auditor" && dataset.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const versions = await DatasetVersion.find({ datasetId: dataset._id })
      .sort({ versionNumber: 1 });

    return res.json(versions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getVersion(req, res) {
  try {
    const { datasetId, versionId } = req.params;
    const dataset = await Dataset.findOne({ datasetId });
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    if (req.user.role !== "auditor" && dataset.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const version = await DatasetVersion.findOne({ datasetId: dataset._id, versionId });
    if (!version) return res.status(404).json({ error: "Version not found" });

    return res.json(version);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { createVersion, listVersions, getVersion };