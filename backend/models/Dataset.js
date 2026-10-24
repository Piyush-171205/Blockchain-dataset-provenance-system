const mongoose = require("mongoose");

const datasetSchema = new mongoose.Schema(
  {
    datasetId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: [true, "Dataset name is required"],
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      default: "",
      maxlength: 1000
    },
    source: {
      type: String,
      default: "",
      maxlength: 200
    },
    category: {
      type: String,
      default: "General",
      maxlength: 80
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    ownerName: {
      type: String,
      required: true
    },
    currentVersion: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active"
    }
  },
  { timestamps: true }
);

datasetSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model("Dataset", datasetSchema);