const fs = require("fs");
const { Dataset, DatasetVersion } = require("../models");
const { sha256File } = require("../services/hashService");

async function verifyStoredVersion(req, res) {
  try {
    const { datasetId, versionId } = req.params;
    const dataset = await Dataset.findOne({ datasetId });
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    if (req.user.role !== "auditor" && dataset.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const version = await DatasetVersion.findOne({
      datasetId: dataset._id,
      versionId
    });
    if (!version) return res.status(404).json({ error: "Version not found" });

    const calculatedHash = await sha256File(version.filePath);

    return res.json({
      result: calculatedHash === version.fileHash ? "match" : "mismatch",
      registeredHash: version.fileHash,
      calculatedHash,
      versionNumber: version.versionNumber,
      blockchainStatus: version.blockchainStatus,
      transactionHash: version.blockchainTxHash
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function verifyUploadedFile(req, res) {
  let uploadedFilePath = req.file?.path;

  try {
    const { datasetId, versionId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "A CSV file is required for verification" });
    }

    const dataset = await Dataset.findOne({ datasetId });
    if (!dataset) {
      fs.unlink(uploadedFilePath, () => {});
      return res.status(404).json({ error: "Dataset not found" });
    }

    if (req.user.role !== "auditor" && dataset.ownerId.toString() !== req.user.id) {
      fs.unlink(uploadedFilePath, () => {});
      return res.status(403).json({ error: "Not authorized" });
    }

    const version = await DatasetVersion.findOne({
      datasetId: dataset._id,
      versionId
    });
    if (!version) {
      fs.unlink(uploadedFilePath, () => {});
      return res.status(404).json({ error: "Version not found" });
    }

    const calculatedHash = await sha256File(uploadedFilePath);
    fs.unlink(uploadedFilePath, () => {});

    return res.json({
      result: calculatedHash === version.fileHash ? "match" : "mismatch",
      registeredHash: version.fileHash,
      calculatedHash,
      versionNumber: version.versionNumber,
      blockchainStatus: version.blockchainStatus,
      transactionHash: version.blockchainTxHash
    });
  } catch (error) {
    if (uploadedFilePath) fs.unlink(uploadedFilePath, () => {});
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { verifyStoredVersion, verifyUploadedFile };