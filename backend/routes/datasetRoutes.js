const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const {
  createDataset,
  listDatasets,
  getDataset,
  deleteDataset
} = require("../controllers/datasetController");

const {
  createVersion,
  listVersions,
  getVersion
} = require("../controllers/versionController");

const {
  listProvenance,
  createProvenanceNote
} = require("../controllers/provenanceController");

const {
  getDatasetOnChain,
  getLatestOnChain
} = require("../controllers/blockchainController");

const {
  verifyStoredVersion,
  verifyUploadedFile
} = require("../controllers/verifyController");

router.use(requireAuth);

// Dataset endpoints
router.post("/", upload.single("file"), createDataset);
router.get("/", listDatasets);
router.get("/:datasetId", getDataset);
router.delete("/:datasetId", deleteDataset);

// Version endpoints
router.post("/:datasetId/versions", upload.single("file"), createVersion);
router.get("/:datasetId/versions", listVersions);
router.get("/:datasetId/versions/:versionId", getVersion);

// Provenance endpoints
router.get("/:datasetId/provenance", listProvenance);
router.post("/:datasetId/provenance", createProvenanceNote);

// Blockchain endpoints
router.get("/:datasetId/blockchain", getDatasetOnChain);
router.get("/:datasetId/blockchain/latest", getLatestOnChain);

// Verification endpoints
router.post("/:datasetId/versions/:versionId/verify", verifyStoredVersion);
router.post(
  "/:datasetId/versions/:versionId/verify-file",
  upload.single("file"),
  verifyUploadedFile
);

module.exports = router;