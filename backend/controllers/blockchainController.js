const { Dataset, DatasetVersion } = require("../models");
const blockchain = require("../services/blockchainService");

async function getDatasetOnChain(req, res) {
  try {
    const { datasetId } = req.params;
    const dataset = await Dataset.findOne({ datasetId });
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    if (req.user.role !== "auditor" && dataset.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (!blockchain.isConfigured()) {
      return res.json({ configured: false, records: [] });
    }

    const records = await blockchain.readDatasetHistory(dataset.datasetId);
    return res.json({ configured: true, records });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getLatestOnChain(req, res) {
  try {
    const { datasetId } = req.params;
    const dataset = await Dataset.findOne({ datasetId });
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    if (req.user.role !== "auditor" && dataset.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (!blockchain.isConfigured()) {
      return res.json({ configured: false, record: null });
    }

    const record = await blockchain.readLatestRecord(dataset.datasetId);
    return res.json({ configured: true, record });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getTransaction(req, res) {
  try {
    const { txHash } = req.params;
    if (!txHash) return res.status(400).json({ error: "Transaction hash required" });

    const { DatasetVersion } = require("../models");
    const version = await DatasetVersion.findOne({ blockchainTxHash: txHash });
    if (!version) return res.status(404).json({ error: "Transaction not found" });

    const dataset = await Dataset.findById(version.datasetId);

    return res.json({
      txHash,
      datasetId: dataset?.datasetId || null,
      datasetName: dataset?.name || null,
      versionId: version.versionId,
      versionNumber: version.versionNumber,
      operation: version.operation,
      fileHash: version.fileHash,
      previousHash: version.previousHash,
      blockchainStatus: version.blockchainStatus,
      createdAt: version.createdAt
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { getDatasetOnChain, getLatestOnChain, getTransaction };