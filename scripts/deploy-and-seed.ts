import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const account1 = signers[1];
  const account2 = signers[2];
  const account3 = signers[3];
  const account4 = signers[4];
  const account5 = signers[5];
  const account6 = signers[6];

  console.log("====================================================");
  console.log("Deploying and seeding GOVDAO local test network...");
  console.log("Deployer:", deployer.address);
  console.log("Member 1:", account1.address);
  console.log("Member 2:", account2.address);
  console.log("Member 3:", account3.address);
  console.log("Member 4:", account4.address);
  console.log("Member 5:", account5.address);
  console.log("====================================================");

  // 1. MemberRegistry — deployer is admin
  const MemberRegistry = await ethers.getContractFactory("MemberRegistry");
  const memberRegistry = await MemberRegistry.deploy(deployer.address);
  await memberRegistry.waitForDeployment();
  console.log("MemberRegistry deployed to:", await memberRegistry.getAddress());

  // 2. Timelock — 60s minimum delay for easy testing
  const timelockDelay = 60;
  const Timelock = await ethers.getContractFactory("Timelock");
  const timelock = await Timelock.deploy(timelockDelay, deployer.address, deployer.address);
  await timelock.waitForDeployment();
  console.log("Timelock deployed to:", await timelock.getAddress());

  // 3. Governor — votingDelay=1, votingPeriod=10 blocks, quorum=20%
  const votingDelay = 1;
  const votingPeriod = 10;
  const quorum = 20;
  const Governor = await ethers.getContractFactory("Governor");
  const governor = await Governor.deploy(
    await memberRegistry.getAddress(),
    await timelock.getAddress(),
    deployer.address,
    votingDelay,
    votingPeriod,
    quorum
  );
  await governor.waitForDeployment();
  console.log("Governor deployed to:", await governor.getAddress());

  // 4. Treasury — spendCapPerTx=10 ETH
  const spendCapPerTx = ethers.parseEther("10");
  const spendCapPerPeriod = ethers.parseEther("50");
  const periodDuration = 30 * 24 * 60 * 60;
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(
    await timelock.getAddress(),
    deployer.address,
    spendCapPerTx,
    spendCapPerPeriod,
    periodDuration
  );
  await treasury.waitForDeployment();
  console.log("Treasury deployed to:", await treasury.getAddress());

  // 5. EmergencyGuardian
  const EmergencyGuardian = await ethers.getContractFactory("EmergencyGuardian");
  const emergencyGuardian = await EmergencyGuardian.deploy(
    [deployer.address],
    1,
    await treasury.getAddress(),
    await governor.getAddress()
  );
  await emergencyGuardian.waitForDeployment();
  console.log("EmergencyGuardian deployed to:", await emergencyGuardian.getAddress());

  // 6. Wire contracts
  await memberRegistry.setGovernor(await governor.getAddress());
  await memberRegistry.setTimelock(await timelock.getAddress());
  await timelock.setGovernor(await governor.getAddress());
  await governor.setGuardianBootstrap(await emergencyGuardian.getAddress());
  await treasury.setGuardianBootstrap(await emergencyGuardian.getAddress());
  await timelock.setGuardianBootstrap(await emergencyGuardian.getAddress());
  console.log("Wiring completed.");

  // 7. Seed Initial Members (via bootstrap admin)
  // Roles: NONE=0, MEMBER=1, PROPOSER=2, EXECUTOR=3, ADMIN=4, GUARDIAN=5
  await memberRegistry.addMember(account1.address, 1); // MEMBER
  await memberRegistry.addMember(account2.address, 2); // PROPOSER
  await memberRegistry.addMember(account3.address, 3); // EXECUTOR
  await memberRegistry.addMember(account4.address, 4); // ADMIN
  await memberRegistry.addMember(account5.address, 1); // MEMBER
  console.log("Seeded initial members.");

  // 8. Seed Treasury Funds
  const fundTx = await deployer.sendTransaction({
    to: await treasury.getAddress(),
    value: ethers.parseEther("25.5")
  });
  await fundTx.wait();
  console.log("Seeded Treasury with 25.5 ETH.");

  // Helper variables for proposal encoding
  const treasuryAddress = await treasury.getAddress();
  const memberRegistryAddress = await memberRegistry.getAddress();
  const timelockAddress = await timelock.getAddress();
  const governorAddress = await governor.getAddress();

  // ==========================================
  // SEED PROPOSAL 1: EXECUTED (Send 5 ETH to account 5)
  // ==========================================
  console.log("\n--- Seeding Proposal 1: EXECUTED ---");
  const p1Target = treasuryAddress;
  const p1Value = 0;
  const p1Calldata = treasury.interface.encodeFunctionData("transferETH", [account5.address, ethers.parseEther("5")]);
  const p1Desc = "Proposal #1: Support core contributor dev workspace upgrade with 5 ETH.";
  const p1Hash = ethers.keccak256(ethers.toUtf8Bytes(p1Desc));

  let tx = await governor.connect(account2).propose([p1Target], [p1Value], [p1Calldata], "ipfs://QmProposal1Metadata", p1Hash);
  await tx.wait();
  console.log("Proposal 1 created.");

  // Mine 1 block to start voting
  await network.provider.send("evm_mine");

  // Cast votes: Accounts 1, 2, 3, 4 vote FOR (1), Account 5 votes AGAINST (0)
  await governor.connect(account1).castVote(1, 1);
  await governor.connect(account2).castVote(1, 1);
  await governor.connect(account3).castVote(1, 1);
  await governor.connect(account4).castVote(1, 1);
  await governor.connect(account5).castVote(1, 0);
  console.log("Proposal 1 votes cast.");

  // Mine 10 blocks to end voting
  await network.provider.send("hardhat_mine", ["0xa"]);

  // Queue proposal
  tx = await governor.queue(1);
  await tx.wait();
  console.log("Proposal 1 queued in timelock.");

  // Increase time by 70s to satisfy 60s timelock delay
  await network.provider.send("evm_increaseTime", [70]);
  await network.provider.send("evm_mine");

  // Execute proposal (Account 3 is EXECUTOR)
  tx = await governor.connect(account3).execute(1);
  await tx.wait();
  console.log("Proposal 1 executed successfully!");

  // ==========================================
  // SEED PROPOSAL 2: DEFEATED (Add Account 6 as member)
  // ==========================================
  console.log("\n--- Seeding Proposal 2: DEFEATED ---");
  const p2Target = memberRegistryAddress;
  const p2Value = 0;
  const p2Calldata = memberRegistry.interface.encodeFunctionData("addMember", [account6.address, 1]);
  const p2Desc = "Proposal #2: Add audit firm observer account to the registry.";
  const p2Hash = ethers.keccak256(ethers.toUtf8Bytes(p2Desc));

  tx = await governor.connect(account2).propose([p2Target], [p2Value], [p2Calldata], "ipfs://QmProposal2Metadata", p2Hash);
  await tx.wait();
  console.log("Proposal 2 created.");

  // Mine 1 block to start voting
  await network.provider.send("evm_mine");

  // Cast votes: Account 1 and 2 vote AGAINST (0), Account 3 votes FOR (1), Account 4 votes AGAINST (0)
  await governor.connect(account1).castVote(2, 0);
  await governor.connect(account2).castVote(2, 0);
  await governor.connect(account3).castVote(2, 1);
  await governor.connect(account4).castVote(2, 0);
  console.log("Proposal 2 votes cast.");

  // Mine 10 blocks to end voting
  await network.provider.send("hardhat_mine", ["0xa"]);
  console.log("Proposal 2 ended (Defeated).");

  // ==========================================
  // SEED PROPOSAL 3: VOTING (Allocate 2 ETH to indexer)
  // ==========================================
  console.log("\n--- Seeding Proposal 3: VOTING (ACTIVE) ---");
  const p3Target = treasuryAddress;
  const p3Value = 0;
  const p3Calldata = treasury.interface.encodeFunctionData("transferETH", [account4.address, ethers.parseEther("2")]);
  const p3Desc = "Proposal #3: Allocate 2 ETH for community indexer hosting endpoints.";
  const p3Hash = ethers.keccak256(ethers.toUtf8Bytes(p3Desc));

  tx = await governor.connect(account2).propose([p3Target], [p3Value], [p3Calldata], "ipfs://QmProposal3Metadata", p3Hash);
  await tx.wait();
  console.log("Proposal 3 created.");

  // Mine 1 block to start voting
  await network.provider.send("evm_mine");

  // Cast some votes, but keep voting window open
  await governor.connect(account1).castVote(3, 1); // FOR
  await governor.connect(account2).castVote(3, 1); // FOR
  console.log("Proposal 3 active voting seeded.");

  // ==========================================
  // SEED PROPOSAL 4: QUEUED (Set timelock delay to 120s)
  // ==========================================
  console.log("\n--- Seeding Proposal 4: QUEUED ---");
  const p4Target = timelockAddress;
  const p4Value = 0;
  const p4Calldata = timelock.interface.encodeFunctionData("setDelay", [120]);
  const p4Desc = "Proposal #4: Increase timelock execution delay from 60s to 120s for extra verification time.";
  const p4Hash = ethers.keccak256(ethers.toUtf8Bytes(p4Desc));

  tx = await governor.connect(account2).propose([p4Target], [p4Value], [p4Calldata], "ipfs://QmProposal4Metadata", p4Hash);
  await tx.wait();
  console.log("Proposal 4 created.");

  // Mine 1 block to start voting
  await network.provider.send("evm_mine");

  // Vote FOR
  await governor.connect(account1).castVote(4, 1);
  await governor.connect(account2).castVote(4, 1);
  await governor.connect(account3).castVote(4, 1);
  await governor.connect(account4).castVote(4, 1);

  // Mine 10 blocks to end voting
  await network.provider.send("hardhat_mine", ["0xa"]);

  // Queue proposal
  tx = await governor.queue(4);
  await tx.wait();
  console.log("Proposal 4 queued in timelock (ready timestamp is in the future).");

  // ==========================================
  // SEED PROPOSAL 5: PROPOSED (Change voting delay to 2 blocks)
  // ==========================================
  console.log("\n--- Seeding Proposal 5: PROPOSED (WARMUP) ---");
  const p5Target = governorAddress;
  const p5Value = 0;
  const p5Calldata = governor.interface.encodeFunctionData("setVotingDelay", [2]);
  const p5Desc = "Proposal #5: Adjust voting delay to 2 blocks to avoid flash-proposal attacks.";
  const p5Hash = ethers.keccak256(ethers.toUtf8Bytes(p5Desc));

  tx = await governor.connect(account2).propose([p5Target], [p5Value], [p5Calldata], "ipfs://QmProposal5Metadata", p5Hash);
  await tx.wait();
  console.log("Proposal 5 created and left in Proposed warmup state.");

  // ==========================================
  // 9. Finalize Bootstrap (revoke admin bootstrap power)
  // ==========================================
  console.log("\n--- Finalizing bootstrap configuration ---");
  await memberRegistry.revokeAdmin();
  await timelock.finalizeBootstrap();
  await governor.finalizeBootstrap();
  await treasury.finalizeBootstrap();
  console.log("Bootstrap finalized successfully.");

  // 10. Write Deployment Record
  const deployment = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
    contracts: {
      memberRegistry: memberRegistryAddress,
      timelock: timelockAddress,
      governor: governorAddress,
      treasury: treasuryAddress,
      emergencyGuardian: await emergencyGuardian.getAddress(),
    },
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${network.name}.json`);
  fs.writeFileSync(outFile, `${JSON.stringify(deployment, null, 2)}\n`);
  console.log(`Deployment record written to deployments/${network.name}.json`);

  console.log("\n====================================================");
  console.log("SEEDING COMPLETED SUCCESSFULLY!");
  console.log("Local chain populated with all Governor state transitions.");
  console.log("====================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
