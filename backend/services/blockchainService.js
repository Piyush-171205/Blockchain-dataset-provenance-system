const { ethers } = require("ethers");

const ABI = [
  "function addRecord(string datasetId, string versionId, string operation, string fileHash, string previousHash)",
  "function getRecordCount(string datasetId) view returns (uint256)",
  "function getRecord(string datasetId, uint256 index) view returns (tuple(string datasetId, string versionId, string operation, string fileHash, string previousHash, uint256 timestamp, address recordedBy))",
  "function getLatestRecord(string datasetId) view returns (tuple(string datasetId, string versionId, string operation, string fileHash, string previousHash, uint256 timestamp, address recordedBy))"
];

function isConfigured() {
  return Boolean(
    process.env.BLOCKCHAIN_RPC_URL &&
      process.env.CONTRACT_ADDRESS &&
      process.env.BLOCKCHAIN_PRIVATE_KEY
  );
}

function getReadContract() {
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  return new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, provider);
}

function getWriteContract() {
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
  return new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, wallet);
}

async function writeProvenance({
  datasetId,
  versionId,
  operation,
  fileHash,
  previousHash
}) {
  if (!isConfigured()) {
    return { status: "not-configured", txHash: "", error: "" };
  }

  try {
    const contract = getWriteContract();
    const tx = await contract.addRecord(
      datasetId,
      versionId,
      operation,
      fileHash,
      previousHash || ""
    );
    const receipt = await tx.wait();

    return {
      status: "confirmed",
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
      error: ""
    };
  } catch (error) {
    return {
      status: "failed",
      txHash: "",
      error: error.shortMessage || error.message || "Blockchain write failed"
    };
  }
}

async function readDatasetHistory(datasetId) {
  if (!isConfigured()) return [];

  const contract = getReadContract();
  const count = Number(await contract.getRecordCount(datasetId));
  const records = [];

  for (let index = 0; index < count; index += 1) {
    const record = await contract.getRecord(datasetId, index);
    records.push({
      datasetId: record.datasetId,
      versionId: record.versionId,
      operation: record.operation,
      fileHash: record.fileHash,
      previousHash: record.previousHash,
      timestamp: Number(record.timestamp),
      recordedBy: record.recordedBy
    });
  }

  return records;
}

async function readLatestRecord(datasetId) {
  if (!isConfigured()) return null;
  const contract = getReadContract();
  try {
    const record = await contract.getLatestRecord(datasetId);
    return {
      datasetId: record.datasetId,
      versionId: record.versionId,
      operation: record.operation,
      fileHash: record.fileHash,
      previousHash: record.previousHash,
      timestamp: Number(record.timestamp),
      recordedBy: record.recordedBy
    };
  } catch {
    return null;
  }
}

module.exports = {
  isConfigured,
  writeProvenance,
  readDatasetHistory,
  readLatestRecord
};