const crypto = require("crypto");
const fs = require("fs");

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

function sha256String(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

module.exports = { sha256File, sha256String };