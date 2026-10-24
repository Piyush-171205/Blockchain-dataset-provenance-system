const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const unique = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    callback(null, unique);
  }
});

function csvFilter(_req, file, callback) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== ".csv") {
    return callback(new Error("Only CSV files are allowed"));
  }
  callback(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: csvFilter
});

module.exports = { upload, uploadDir };