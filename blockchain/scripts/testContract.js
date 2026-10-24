const hre = require("hardhat");

async function main() {
  // 1. Connect to the deployed contract
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const contract = await hre.ethers.getContractAt(
    "DatasetProvenance",
    contractAddress
  );

  console.log("Connected to contract at:", contractAddress);
  console.log("---------------------------------------------");

  // 2. Fake dataset/version data
  const datasetId = "test-dataset-001";
  const versionId = "test-version-001";
  const operation = "CREATED";
  const fileHash = "abc123hashvalue";
  const previousHash = "";

  // 3. Add a provenance record on-chain
  console.log("Adding provenance record...");
  const tx = await contract.addRecord(
    datasetId,
    versionId,
    operation,
    fileHash,
    previousHash
  );
  await tx.wait();
  console.log("Transaction mined:", tx.hash);
  console.log("---------------------------------------------");

  // 4. Retrieve record count
  const count = await contract.getRecordCount(datasetId);
  console.log("Record count for dataset:", count.toString());

  // 5. Retrieve the record we just added
  const record = await contract.getRecord(datasetId, 0);
  console.log("---------------------------------------------");
  console.log("Stored record:");
  console.log("  datasetId:   ", record.datasetId);
  console.log("  versionId:   ", record.versionId);
  console.log("  operation:   ", record.operation);
  console.log("  fileHash:    ", record.fileHash);
  console.log("  previousHash:", record.previousHash || "(empty)");
  console.log("  recordedBy:  ", record.recordedBy);
  console.log("  timestamp:   ", new Date(Number(record.timestamp) * 1000).toISOString());
  console.log("---------------------------------------------");
  console.log("✅ Contract works correctly.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });