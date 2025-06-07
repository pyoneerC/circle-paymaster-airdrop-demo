
const { ethers } = require("hardhat");

async function main() {
  // Deploy BountyToken first
  const BountyToken = await ethers.getContractFactory("BountyToken");
  const bountyToken = await BountyToken.deploy();
  await bountyToken.waitForDeployment();
  
  console.log("BountyToken deployed to:", await bountyToken.getAddress());
  
  // Deploy AirdropClaimer
  const AirdropClaimer = await ethers.getContractFactory("AirdropClaimer");
  const airdropClaimer = await AirdropClaimer.deploy(await bountyToken.getAddress());
  await airdropClaimer.waitForDeployment();
  
  console.log("AirdropClaimer deployed to:", await airdropClaimer.getAddress());
  
  // Transfer tokens to the claimer contract
  const transferAmount = ethers.parseEther("1000000"); // 1M tokens
  await bountyToken.transfer(await airdropClaimer.getAddress(), transferAmount);
  
  console.log("Transferred tokens to AirdropClaimer");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
