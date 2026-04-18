import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. MemberRegistry — deployer is bootstrap admin
  const MemberRegistry = await ethers.getContractFactory("MemberRegistry");
  const memberRegistry = await MemberRegistry.deploy(deployer.address);
  await memberRegistry.waitForDeployment();
  console.log("MemberRegistry:", await memberRegistry.getAddress());

  // 2. Timelock — 2-day delay, governor set after Governor deploys
  const timelockDelay = 2 * 24 * 60 * 60; // 2 days
  const Timelock = await ethers.getContractFactory("Timelock");
  // Use deployer as placeholder governor; will update after Governor deploys
  const timelock = await Timelock.deploy(timelockDelay, deployer.address, deployer.address);
  await timelock.waitForDeployment();
  console.log("Timelock:", await timelock.getAddress());

  // 3. Governor
  const votingDelay = 1;     // 1 block delay before voting
  const votingPeriod = 50400; // ~7 days at 12s blocks
  const quorum = 20;          // 20% quorum
  const Governor = await ethers.getContractFactory("Governor");
  const governor = await Governor.deploy(
    await memberRegistry.getAddress(),
    await timelock.getAddress(),
    deployer.address, // guardian placeholder
    votingDelay,
    votingPeriod,
    quorum
  );
  await governor.waitForDeployment();
  console.log("Governor:", await governor.getAddress());

  // 4. Treasury — controlled by Timelock, guardian is deployer for now
  const spendCapPerTx = ethers.parseEther("10");   // 10 ETH per tx
  const spendCapPerPeriod = ethers.parseEther("50"); // 50 ETH per 30-day period
  const periodDuration = 30 * 24 * 60 * 60; // 30 days
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(
    await timelock.getAddress(),
    deployer.address, // guardian placeholder
    spendCapPerTx,
    spendCapPerPeriod,
    periodDuration
  );
  await treasury.waitForDeployment();
  console.log("Treasury:", await treasury.getAddress());

  // 5. EmergencyGuardian — single signer for local/test (production: multi-sig)
  const EmergencyGuardian = await ethers.getContractFactory("EmergencyGuardian");
  const emergencyGuardian = await EmergencyGuardian.deploy(
    [deployer.address],
    1, // threshold = 1 for testing
    await treasury.getAddress(),
    await governor.getAddress()
  );
  await emergencyGuardian.waitForDeployment();
  console.log("EmergencyGuardian:", await emergencyGuardian.getAddress());

  // 6. Wire up: set Governor as the MemberRegistry's governor
  await memberRegistry.setGovernor(await governor.getAddress());
  console.log("MemberRegistry governor set to Governor");

  // 7. Update Treasury guardian to EmergencyGuardian
  // (Treasury guardian update requires going through Timelock, but for initial deploy
  //  we set the deployer as guardian. In production, use governance to update.)

  console.log("\n=== Deployment Complete ===");
  console.log("Next steps:");
  console.log("1. Transfer Timelock governor role to Governor contract");
  console.log("2. Set EmergencyGuardian as Treasury guardian via governance");
  console.log("3. Revoke deployer admin via governance proposal");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
