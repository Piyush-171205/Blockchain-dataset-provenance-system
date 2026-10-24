const mongoose = require("mongoose");

const datasetVersionSchema = new mongoose.Schema(
  {
    datasetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dataset",
      required: true,
      index: true
    },
    versionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    versionNumber: {
      type: Number,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    storedFileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      default: 0
    },
    fileHash: {
      type: String,
      required: true,
      index: true
    },
    previousVersionId: {
      type: String,
      default: ""
    },
    previousHash: {
      type: String,
      default: ""
    },
    operation: {
      type: String,
      required: true,
      enum: [
        "CREATED",
        "UPLOADED",
        "CLEANED",
        "FILTERED",
        "TRANSFORMED",
        "MERGED",
        "UPDATED",
        "ANALYZED",
        "EXPORTED"
      ],
      default: "CREATED"
    },
    changeDescription: {
      type: String,
      default: ""
    },
    reason: {
      type: String,
      default: ""
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    createdByName: {
      type: String,
      required: true
    },
    blockchainStatus: {
      type: String,
      enum: ["pending", "confirmed", "failed", "not-configured"],
      default: "pending"
    },
    blockchainTxHash: {
      type: String,
      default: ""
    },
    blockchainError: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

datasetVersionSchema.index({ datasetId: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.model("DatasetVersion", datasetVersionSchema);