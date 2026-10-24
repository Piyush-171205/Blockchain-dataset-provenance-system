const mongoose = require("mongoose");

const provenanceEventSchema = new mongoose.Schema(
  {
    datasetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dataset",
      required: true,
      index: true
    },
    versionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DatasetVersion",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    operation: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    reason: {
      type: String,
      default: ""
    },
    fileHash: {
      type: String,
      required: true
    },
    previousHash: {
      type: String,
      default: ""
    },
    blockchainTxHash: {
      type: String,
      default: ""
    },
    blockchainStatus: {
      type: String,
      enum: ["pending", "confirmed", "failed", "not-configured"],
      default: "pending"
    }
  },
  { timestamps: true }
);

provenanceEventSchema.index({ datasetId: 1, createdAt: -1 });

module.exports = mongoose.model("ProvenanceEvent", provenanceEventSchema);