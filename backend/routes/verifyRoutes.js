const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const {
  verifyStoredVersion,
  verifyUploadedFile
} = require("../controllers/verifyController");

router.use(requireAuth);

router.post("/:datasetId/:versionId", verifyStoredVersion);
router.post("/:datasetId/:versionId/file", upload.single("file"), verifyUploadedFile);

module.exports = router;