import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

function parseAddressList(name: string): string[] {
  const raw = process.env[name];
  if (!raw) {
    return [];
  }

  return [...new Set(
    raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  )];
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const initialProposers = parseAddressList("INITIAL_PROPOSERS");
  const initialExecutors = parseAddressList("INITIAL_EXECUTORS");
  const initialMembers = parseAddressList("INITIAL_MEMBERS");

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

  await memberRegistry.setTimelock(await timelock.getAddress());
  console.log("MemberRegistry timelock set to Timelock");

  for (const proposer of initialProposers) {
    if (proposer.toLowerCase() === deployer.address.toLowerCase()) {
      continue;
    }

    if (!(await memberRegistry.isMember(proposer))) {
      await memberRegistry.addMember(proposer, 2);
      console.log("Seeded proposer:", proposer);
    }
  }

  for (const executor of initialExecutors) {
    if (executor.toLowerCase() === deployer.address.toLowerCase()) {
      continue;
    }

    if (!(await memberRegistry.isMember(executor))) {
      await memberRegistry.addMember(executor, 3);
      console.log("Seeded executor:", executor);
    }
  }

  for (const member of initialMembers) {
    if (member.toLowerCase() === deployer.address.toLowerCase()) {
      continue;
    }

    if (!(await memberRegistry.isMember(member))) {
      await memberRegistry.addMember(member, 1);
      console.log("Seeded member:", member);
    }
  }

  if (initialProposers.length === 0) {
    console.log("Warning: no INITIAL_PROPOSERS configured; deployer remains the only initial proposer.");
  }

  if (initialExecutors.length === 0) {
    console.log("Warning: no INITIAL_EXECUTORS configured; deployer remains the only initial executor.");
  }

  // 7. Wire Timelock governor to Governor contract
  await timelock.setGovernor(await governor.getAddress());
  console.log("Timelock governor set to Governor");

  // 8. Set EmergencyGuardian as guardian for all contracts
  await governor.setGuardianBootstrap(await emergencyGuardian.getAddress());
  await treasury.setGuardianBootstrap(await emergencyGuardian.getAddress());
  await timelock.setGuardianBootstrap(await emergencyGuardian.getAddress());
  console.log("All guardians set to EmergencyGuardian");

  // 9. Revoke bootstrap admin path in the registry now that timelock is wired.
  await memberRegistry.revokeAdmin();
  console.log("MemberRegistry bootstrap admin revoked");

  // 10. Finalize bootstrap — lock out deployer from timelock-controlled contracts
  await timelock.finalizeBootstrap();
  await governor.finalizeBootstrap();
  await treasury.finalizeBootstrap();
  console.log("Bootstrap finalized — deployer privileges revoked");

  // Emit a machine-readable record so `wire-manifest` can build a production manifest.
  const deployment = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
    contracts: {
      memberRegistry: await memberRegistry.getAddress(),
      timelock: await timelock.getAddress(),
      governor: await governor.getAddress(),
      treasury: await treasury.getAddress(),
      emergencyGuardian: await emergencyGuardian.getAddress(),
    },
  };
  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${network.name}.json`);
  fs.writeFileSync(outFile, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log("\n=== Deployment Complete ===");
  console.log("All contracts deployed and wired. Bootstrap admin privileges revoked.");
  console.log("Governance execution now runs through the timelock and seeded member set.");
  console.log(`Deployment record written to deployments/${network.name}.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
