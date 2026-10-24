const { Dataset, ProvenanceEvent, DatasetVersion } = require("../models");

async function listProvenance(req, res) {
  try {
    const { datasetId } = req.params;
    const dataset = await Dataset.findOne({ datasetId });
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    if (req.user.role !== "auditor" && dataset.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const events = await ProvenanceEvent.find({ datasetId: dataset._id })
      .sort({ createdAt: -1 });

    return res.json(events);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function createProvenanceNote(req, res) {
  try {
    const { datasetId } = req.params;
    const { versionId, operation, description = "", reason = "" } = req.body;

    if (!versionId || !operation) {
      return res.status(400).json({ error: "versionId and operation are required" });
    }

    const dataset = await Dataset.findOne({ datasetId });
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });
    if (dataset.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the owner can add provenance events" });
    }

    const version = await DatasetVersion.findOne({ datasetId: dataset._id, versionId });
    if (!version) return res.status(404).json({ error: "Version not found" });

    const event = await ProvenanceEvent.create({
      datasetId: dataset._id,
      versionId: version._id,
      userId: req.user.id,
      userName: req.user.name,
      operation,
      description,
      reason,
      fileHash: version.fileHash,
      previousHash: version.previousHash,
      blockchainStatus: version.blockchainStatus,
      blockchainTxHash: version.blockchainTxHash
    });

    return res.status(201).json(event);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { listProvenance, createProvenanceNote };