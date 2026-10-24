const hre = require("hardhat");

async function main() {
  console.log("Deploying DatasetProvenance contract...");

  const Factory = await hre.ethers.getContractFactory("DatasetProvenance");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ DatasetProvenance deployed to:", address);
  console.log("");
  console.log("Copy this address into backend/.env as CONTRACT_ADDRESS");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });