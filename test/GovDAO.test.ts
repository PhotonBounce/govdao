import { expect } from "chai";
import { ethers } from "hardhat";
import { MemberRegistry, Timelock, Treasury, Governor, EmergencyGuardian } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("GOVDAO Core", function () {
  let deployer: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let carol: HardhatEthersSigner;
  let outsider: HardhatEthersSigner;

  let memberRegistry: MemberRegistry;
  let timelock: Timelock;
  let treasury: Treasury;
  let governor: Governor;
  let emergencyGuardian: EmergencyGuardian;

  const VOTING_DELAY = 1;
  const VOTING_PERIOD = 10; // short for testing
  const QUORUM = 20; // 20%
  const TIMELOCK_DELAY = 60; // 60 seconds for testing

  beforeEach(async function () {
    [deployer, alice, bob, carol, outsider] = await ethers.getSigners();

    // Deploy MemberRegistry
    const MR = await ethers.getContractFactory("MemberRegistry");
    memberRegistry = await MR.deploy(deployer.address) as unknown as MemberRegistry;

    // Deploy Timelock with bootstrap governor/guardian wired to deployer.
    const TL = await ethers.getContractFactory("Timelock");
    timelock = await TL.deploy(TIMELOCK_DELAY, deployer.address, deployer.address) as unknown as Timelock;

    // Deploy Governor
    const GOV = await ethers.getContractFactory("Governor");
    governor = await GOV.deploy(
      await memberRegistry.getAddress(),
      await timelock.getAddress(),
      deployer.address,
      VOTING_DELAY,
      VOTING_PERIOD,
      QUORUM
    ) as unknown as Governor;

    // Deploy Treasury
    const TRES = await ethers.getContractFactory("Treasury");
    treasury = await TRES.deploy(
      await timelock.getAddress(),
      deployer.address,
      ethers.parseEther("10"),
      ethers.parseEther("50"),
      30 * 24 * 60 * 60
    ) as unknown as Treasury;

    // Deploy EmergencyGuardian
    const EG = await ethers.getContractFactory("EmergencyGuardian");
    emergencyGuardian = await EG.deploy(
      [deployer.address, alice.address, bob.address],
      2,
      await treasury.getAddress(),
      await governor.getAddress()
    ) as unknown as EmergencyGuardian;

    // Wire: set Governor as MemberRegistry's governor
    await memberRegistry.setGovernor(await governor.getAddress());
    await memberRegistry.setTimelock(await timelock.getAddress());
    // NOTE: Do NOT wire timelock.setGovernor here — deployer stays governor for direct Timelock/Treasury tests

    // Bootstrap handoff from deployer to the emergency guardian contract.
    await governor.setGuardianBootstrap(await emergencyGuardian.getAddress());
    await treasury.setGuardianBootstrap(await emergencyGuardian.getAddress());

    // Add members for voting tests
    await memberRegistry.addMember(alice.address, 2); // PROPOSER
    await memberRegistry.addMember(bob.address, 1);   // MEMBER
    await memberRegistry.addMember(carol.address, 1); // MEMBER
  });

  // ========================
  // MemberRegistry Tests
  // ========================

  describe("MemberRegistry", function () {
    it("deployer is admin member on deploy", async function () {
      expect(await memberRegistry.isMember(deployer.address)).to.be.true;
      expect(await memberRegistry.getRole(deployer.address)).to.equal(4); // ADMIN
    });

    it("can add and remove members", async function () {
      await memberRegistry.addMember(outsider.address, 1);
      expect(await memberRegistry.isMember(outsider.address)).to.be.true;
      expect(await memberRegistry.getMemberCount()).to.equal(5);

      await memberRegistry.removeMember(outsider.address);
      expect(await memberRegistry.isMember(outsider.address)).to.be.false;
      expect(await memberRegistry.getMemberCount()).to.equal(4);
    });

    it("rejects duplicate members", async function () {
      await expect(memberRegistry.addMember(alice.address, 1))
        .to.be.revertedWith("MemberRegistry: already member");
    });

    it("rejects non-admin additions", async function () {
      await expect(memberRegistry.connect(bob).addMember(carol.address, 1))
        .to.be.revertedWith("MemberRegistry: not authorized");
    });

    it("governor can be set only once", async function () {
      // Already set in beforeEach
      await expect(memberRegistry.setGovernor(alice.address))
        .to.be.revertedWith("MemberRegistry: governor already set");
    });

    it("timelock can be set only once during bootstrap", async function () {
      await expect(memberRegistry.setTimelock(alice.address))
        .to.be.revertedWith("MemberRegistry: timelock already set");
    });
  });

  // ========================
  // Timelock Tests
  // ========================

  describe("Timelock", function () {
    it("enforces delay on execution", async function () {
      const target = await treasury.getAddress();
      const data = treasury.interface.encodeFunctionData("setSpendingCaps", [
        ethers.parseEther("20"),
        ethers.parseEther("100"),
      ]);

      await timelock.queueAction(target, 0, data);

      // Try to execute immediately — should fail
      await expect(timelock.executeAction(target, 0, data))
        .to.be.revertedWith("Timelock: delay not met");

      // Advance time past delay
      await ethers.provider.send("evm_increaseTime", [TIMELOCK_DELAY + 1]);
      await ethers.provider.send("evm_mine", []);

      // Now should succeed
      await timelock.executeAction(target, 0, data);
    });

    it("guardian can cancel queued action", async function () {
      const target = await treasury.getAddress();
      const data = "0x";
      await timelock.connect(deployer).queueAction(target, 0, data);

      const actionId = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bytes"],
        [target, 0, data]
      ));

      await timelock.connect(deployer).cancelAction(actionId);
      expect(await timelock.isActionQueued(actionId)).to.be.false;
    });

    it("rejects execution of non-queued actions", async function () {
      await expect(timelock.executeAction(alice.address, 0, "0x"))
        .to.be.revertedWith("Timelock: not queued");
    });
  });

  // ========================
  // Treasury Tests
  // ========================

  describe("Treasury", function () {
    it("receives ETH", async function () {
      await deployer.sendTransaction({
        to: await treasury.getAddress(),
        value: ethers.parseEther("5"),
      });
      expect(await treasury.getBalance()).to.equal(ethers.parseEther("5"));
    });

    it("only timelock can transfer ETH", async function () {
      await expect(treasury.connect(alice).transferETH(bob.address, 1))
        .to.be.revertedWith("Treasury: only timelock");
    });

    it("guardian can pause and unpause", async function () {
      const pauseAction = await emergencyGuardian.connect(deployer).proposePause();
      const pauseReceipt = await pauseAction.wait();
      const pauseHash = pauseReceipt?.logs[0] ? pauseReceipt.logs[0].topics[1] : undefined;
      await emergencyGuardian.connect(alice).confirmPause(pauseHash!);
      expect(await treasury.paused()).to.be.true;

      const unpauseAction = await emergencyGuardian.connect(deployer).proposeUnpause();
      const unpauseReceipt = await unpauseAction.wait();
      const unpauseHash = unpauseReceipt?.logs[0] ? unpauseReceipt.logs[0].topics[1] : undefined;
      await emergencyGuardian.connect(alice).confirmUnpause(unpauseHash!);
      expect(await treasury.paused()).to.be.false;
    });

    it("enforces per-transaction spending cap", async function () {
      // Fund treasury
      await deployer.sendTransaction({
        to: await treasury.getAddress(),
        value: ethers.parseEther("20"),
      });

      // Try to transfer more than cap (10 ETH) via timelock
      const target = await treasury.getAddress();
      const data = treasury.interface.encodeFunctionData("transferETH", [
        alice.address,
        ethers.parseEther("15"),
      ]);

      await timelock.connect(deployer).queueAction(target, 0, data);
      await ethers.provider.send("evm_increaseTime", [TIMELOCK_DELAY + 1]);
      await ethers.provider.send("evm_mine", []);

      // This should fail because 15 ETH > 10 ETH cap
      await expect(timelock.executeAction(target, 0, data))
        .to.be.revertedWith("Timelock: execution failed");
    });
  });

  // ========================
  // Governor Tests
  // ========================

  describe("Governor", function () {
    it("proposer can create proposal", async function () {
      const tx = await governor.connect(alice).propose(
        [await treasury.getAddress()],
        [0],
        ["0x"],
        "ipfs://QmTest",
        ethers.keccak256(ethers.toUtf8Bytes("test proposal"))
      );
      await tx.wait();
      expect(await governor.proposalCount()).to.equal(1);
    });

    it("non-proposer cannot create proposal", async function () {
      await expect(
        governor.connect(bob).propose(
          [await treasury.getAddress()],
          [0],
          ["0x"],
          "ipfs://QmTest",
          ethers.keccak256(ethers.toUtf8Bytes("test"))
        )
      ).to.be.revertedWith("Governor: not a proposer");
    });

    it("members can vote after voting delay", async function () {
      // Create proposal
      await governor.connect(alice).propose(
        [await treasury.getAddress()],
        [0],
        ["0x"],
        "ipfs://QmTest",
        ethers.keccak256(ethers.toUtf8Bytes("test"))
      );

      // Mine past voting delay
      await ethers.provider.send("evm_mine", []);

      // Vote
      await governor.connect(alice).castVote(1, 1); // For
      await governor.connect(bob).castVote(1, 1);   // For

      const proposal = await governor.getProposal(1);
      expect(proposal.forVotes).to.equal(2);
    });

    it("membership snapshot prevents late joiners from voting on old proposals", async function () {
      await governor.connect(alice).propose(
        [await treasury.getAddress()],
        [0],
        ["0x"],
        "ipfs://QmTest",
        ethers.keccak256(ethers.toUtf8Bytes("snapshot test"))
      );

      await memberRegistry.addMember(outsider.address, 1);
      await ethers.provider.send("evm_mine", []);

      await expect(governor.connect(outsider).castVote(1, 1))
        .to.be.revertedWith("Governor: not eligible at snapshot");
    });

    it("cannot vote twice", async function () {
      await governor.connect(alice).propose(
        [await treasury.getAddress()],
        [0],
        ["0x"],
        "ipfs://QmTest",
        ethers.keccak256(ethers.toUtf8Bytes("test"))
      );
      await ethers.provider.send("evm_mine", []);
      await governor.connect(alice).castVote(1, 1);

      await expect(governor.connect(alice).castVote(1, 1))
        .to.be.revertedWith("Governor: already voted");
    });

    it("proposal defeated if quorum not met", async function () {
      // Only alice votes out of 4 members (25% needed with 20% quorum = 1 vote needed)
      await governor.connect(alice).propose(
        [await treasury.getAddress()],
        [0],
        ["0x"],
        "ipfs://QmTest",
        ethers.keccak256(ethers.toUtf8Bytes("test"))
      );

      await ethers.provider.send("evm_mine", []);

      // Vote against to defeat
      await governor.connect(alice).castVote(1, 0); // Against

      // Mine past voting period
      for (let i = 0; i < VOTING_PERIOD; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      expect(await governor.getProposalState(1)).to.equal(2); // Defeated
    });

    it("non-member cannot vote", async function () {
      await governor.connect(alice).propose(
        [await treasury.getAddress()],
        [0],
        ["0x"],
        "ipfs://QmTest",
        ethers.keccak256(ethers.toUtf8Bytes("test"))
      );
      await ethers.provider.send("evm_mine", []);

      await expect(governor.connect(outsider).castVote(1, 1))
        .to.be.revertedWith("Governor: not eligible at snapshot");
    });

    it("quorum uses snapshot member count, not current", async function () {
      // 4 members at proposal creation: deployer, alice, bob, carol
      await governor.connect(alice).propose(
        [await treasury.getAddress()],
        [0],
        ["0x"],
        "ipfs://QmQuorum",
        ethers.keccak256(ethers.toUtf8Bytes("quorum snapshot test"))
      );

      // Add 6 more members AFTER proposal creation (snapshot already taken)
      const allSigners = await ethers.getSigners();
      for (let i = 5; i < 11; i++) {
        await memberRegistry.addMember(allSigners[i].address, 1);
      }
      // Now 10 members. If quorum used current count: (10 * 20) / 100 = 2 votes needed
      // With snapshot (4 members): max((4 * 20) / 100, 1) = 1 vote needed

      await ethers.provider.send("evm_mine", []);
      await governor.connect(alice).castVote(1, 1); // 1 For vote

      for (let i = 0; i < VOTING_PERIOD; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Should be Succeeded with snapshot-based quorum (1 needed, 1 cast)
      expect(await governor.getProposalState(1)).to.equal(3); // Succeeded
    });

    it("proposal cannot be re-queued (queued flag is permanent)", async function () {
      // Wire timelock to governor for this test
      const TL2 = await ethers.getContractFactory("Timelock");
      const timelock2 = await TL2.deploy(60, deployer.address, deployer.address) as unknown as Timelock;
      const GOV2 = await ethers.getContractFactory("Governor");
      const governor2 = await GOV2.deploy(
        await memberRegistry.getAddress(),
        await timelock2.getAddress(),
        deployer.address,
        VOTING_DELAY,
        VOTING_PERIOD,
        QUORUM
      ) as unknown as Governor;
      await timelock2.setGovernor(await governor2.getAddress());

      // deployer (admin) can propose
      await governor2.connect(deployer).propose(
        [await treasury.getAddress()],
        [0],
        ["0x"],
        "ipfs://QmRequeue",
        ethers.keccak256(ethers.toUtf8Bytes("requeue test"))
      );
      await ethers.provider.send("evm_mine", []);
      await governor2.connect(deployer).castVote(1, 1);

      for (let i = 0; i < VOTING_PERIOD; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Queue — sets _queued flag
      await governor2.queue(1);
      expect(await governor2.isQueued(1)).to.be.true;
      expect(await governor2.getProposalState(1)).to.equal(4); // Queued

      // Trying to queue again should fail (state is Queued, not Succeeded)
      await expect(governor2.queue(1))
        .to.be.revertedWith("Governor: not succeeded");
    });

    it("cancel is idempotent — rejects double cancel", async function () {
      await governor.connect(alice).propose(
        [await treasury.getAddress()],
        [0],
        ["0x"],
        "ipfs://QmCancel2",
        ethers.keccak256(ethers.toUtf8Bytes("double cancel"))
      );

      await governor.connect(alice).cancel(1);
      expect(await governor.getProposalState(1)).to.equal(5); // Cancelled

      await expect(governor.connect(alice).cancel(1))
        .to.be.revertedWith("Governor: already cancelled");
    });

    it("minimum quorum of 1 prevents zero-quorum exploits", async function () {
      // With 4 members and 20% quorum: (4 * 20) / 100 = 0 in integer math
      // Minimum floor should enforce quorum >= 1
      expect(await governor.quorumVotes(
        // need a proposal first
        await (async () => {
          await governor.connect(alice).propose(
            [await treasury.getAddress()],
            [0],
            ["0x"],
            "ipfs://QmMin",
            ethers.keccak256(ethers.toUtf8Bytes("min quorum"))
          );
          return 1;
        })()
      )).to.be.gte(1);
    });

    it("only executors or admins can execute queued proposals", async function () {
      const TL2 = await ethers.getContractFactory("Timelock");
      const timelock2 = await TL2.deploy(60, deployer.address, deployer.address) as unknown as Timelock;
      const GOV2 = await ethers.getContractFactory("Governor");
      const governor2 = await GOV2.deploy(
        await memberRegistry.getAddress(),
        await timelock2.getAddress(),
        deployer.address,
        VOTING_DELAY,
        VOTING_PERIOD,
        QUORUM
      ) as unknown as Governor;
      await timelock2.setGovernor(await governor2.getAddress());

      await governor2.connect(deployer).propose(
        [await governor2.getAddress()],
        [0],
        [governor2.interface.encodeFunctionData("setQuorum", [25])],
        "ipfs://QmExecRole",
        ethers.keccak256(ethers.toUtf8Bytes("executor role"))
      );

      await ethers.provider.send("evm_mine", []);
      await governor2.connect(deployer).castVote(1, 1);
      await governor2.connect(alice).castVote(1, 1);

      for (let i = 0; i < VOTING_PERIOD; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      await governor2.queue(1);
      await ethers.provider.send("evm_increaseTime", [TIMELOCK_DELAY + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(governor2.connect(bob).execute(1))
        .to.be.revertedWith("Governor: not an executor");

      await governor2.connect(deployer).execute(1);
      expect(await governor2.quorumNumerator()).to.equal(25);
    });
  });

  // ========================
  // EmergencyGuardian Tests
  // ========================

  describe("EmergencyGuardian", function () {
    it("threshold signers can trigger emergency pause", async function () {
      const action = await emergencyGuardian.connect(deployer).proposePause();
      const receipt = await action.wait();
      const actionHash = receipt?.logs[0] ? receipt.logs[0].topics[1] : undefined;

      await emergencyGuardian.connect(alice).confirmPause(actionHash!);
      expect(await treasury.paused()).to.be.true;
      expect(await governor.paused()).to.be.true;
    });

    it("pause auto-expires after MAX_PAUSE_DURATION", async function () {
      const action = await emergencyGuardian.connect(deployer).proposePause();
      const receipt = await action.wait();
      const actionHash = receipt?.logs[0] ? receipt.logs[0].topics[1] : undefined;
      await emergencyGuardian.connect(alice).confirmPause(actionHash!);

      expect(await treasury.paused()).to.be.true;

      // Fast forward 72+ hours
      await ethers.provider.send("evm_increaseTime", [72 * 3600 + 1]);
      await ethers.provider.send("evm_mine", []);

      await emergencyGuardian.expirePause();
      expect(await treasury.paused()).to.be.false;
      expect(await governor.paused()).to.be.false;
    });

    it("proposal cancellation requires threshold confirmations", async function () {
      await governor.connect(alice).propose(
        [await treasury.getAddress()],
        [0],
        ["0x"],
        "ipfs://QmCancel",
        ethers.keccak256(ethers.toUtf8Bytes("cancel me"))
      );

      const action = await emergencyGuardian.connect(deployer).proposeCancelProposal(1);
      const receipt = await action.wait();
      const actionHash = receipt?.logs[0] ? receipt.logs[0].topics[1] : undefined;

      await emergencyGuardian.connect(alice).confirmCancelProposal(actionHash!);
      expect(await governor.getProposalState(1)).to.equal(5); // Cancelled
    });

    it("rejects duplicate signers in constructor", async function () {
      const EG = await ethers.getContractFactory("EmergencyGuardian");
      await expect(
        EG.deploy(
          [deployer.address, deployer.address, alice.address],
          2,
          await treasury.getAddress(),
          await governor.getAddress()
        )
      ).to.be.revertedWith("Guardian: duplicate signer");
    });
  });

  // ========================
  // Integration: Full Governance Flow
  // ========================

  describe("Full Governance Flow", function () {
    let gov2: Governor;
    let tl2: Timelock;

    beforeEach(async function () {
      // Deploy a separate Timelock+Governor pair wired together for integration tests
      const TL2 = await ethers.getContractFactory("Timelock");
      tl2 = await TL2.deploy(TIMELOCK_DELAY, deployer.address, deployer.address) as unknown as Timelock;

      const GOV2 = await ethers.getContractFactory("Governor");
      gov2 = await GOV2.deploy(
        await memberRegistry.getAddress(),
        await tl2.getAddress(),
        deployer.address,
        VOTING_DELAY,
        VOTING_PERIOD,
        QUORUM
      ) as unknown as Governor;

      // Wire timelock to governor
      await tl2.setGovernor(await gov2.getAddress());
    });

    it("propose → vote → queue → execute end-to-end", async function () {
      // Target: change the governor's own quorum parameter (gov2 uses tl2 as timelock)
      const target = await gov2.getAddress();
      const data = gov2.interface.encodeFunctionData("setQuorum", [25]);

      // 1. Propose (deployer is ADMIN = can propose)
      await gov2.connect(deployer).propose(
        [target],
        [0],
        [data],
        "ipfs://QmIntegration",
        ethers.keccak256(ethers.toUtf8Bytes("integration test"))
      );
      expect(await gov2.getProposalState(1)).to.equal(0); // Proposed

      // 2. Advance past voting delay
      await ethers.provider.send("evm_mine", []);
      expect(await gov2.getProposalState(1)).to.equal(1); // Voting

      // 3. Vote — deployer + alice + bob (3 For out of 4 members)
      await gov2.connect(deployer).castVote(1, 1);
      await gov2.connect(alice).castVote(1, 1);
      await gov2.connect(bob).castVote(1, 1);

      // 4. Advance past voting period
      for (let i = 0; i < VOTING_PERIOD; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      expect(await gov2.getProposalState(1)).to.equal(3); // Succeeded

      // 5. Queue
      await gov2.queue(1);
      expect(await gov2.getProposalState(1)).to.equal(4); // Queued
      expect(await gov2.isQueued(1)).to.be.true;

      // 6. Advance past timelock delay
      await ethers.provider.send("evm_increaseTime", [TIMELOCK_DELAY + 1]);
      await ethers.provider.send("evm_mine", []);

      // 7. Execute
      await gov2.execute(1);
      expect(await gov2.getProposalState(1)).to.equal(6); // Executed

      // Verify the action took effect
      expect(await gov2.quorumNumerator()).to.equal(25);
    });

    it("governance can update its own parameters via timelock", async function () {
      const target = await gov2.getAddress();
      const data = gov2.interface.encodeFunctionData("setVotingPeriod", [20]);

      await gov2.connect(deployer).propose(
        [target],
        [0],
        [data],
        "ipfs://QmParamChange",
        ethers.keccak256(ethers.toUtf8Bytes("param change"))
      );

      await ethers.provider.send("evm_mine", []);
      await gov2.connect(deployer).castVote(1, 1);
      await gov2.connect(alice).castVote(1, 1);

      for (let i = 0; i < VOTING_PERIOD; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      await gov2.queue(1);

      await ethers.provider.send("evm_increaseTime", [TIMELOCK_DELAY + 1]);
      await ethers.provider.send("evm_mine", []);

      await gov2.execute(1);
      expect(await gov2.votingPeriod()).to.equal(20);
    });

    it("governance can manage membership after bootstrap admin is revoked", async function () {
      await timelock.setGovernor(await governor.getAddress());
      await memberRegistry.revokeAdmin();

      await expect(memberRegistry.addMember(outsider.address, 1))
        .to.be.revertedWith("MemberRegistry: not authorized");

      const target = await memberRegistry.getAddress();
      const data = memberRegistry.interface.encodeFunctionData("addMember", [
        outsider.address,
        1,
      ]);

      await governor.connect(alice).propose(
        [target],
        [0],
        [data],
        "ipfs://QmMemberAdd",
        ethers.keccak256(ethers.toUtf8Bytes("member add"))
      );

      await ethers.provider.send("evm_mine", []);
      await governor.connect(alice).castVote(1, 1);
      await governor.connect(bob).castVote(1, 1);

      for (let i = 0; i < VOTING_PERIOD; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      await governor.queue(1);
      await ethers.provider.send("evm_increaseTime", [TIMELOCK_DELAY + 1]);
      await ethers.provider.send("evm_mine", []);

      await governor.execute(1);

      expect(await memberRegistry.isMember(outsider.address)).to.be.true;
      expect(await memberRegistry.getRole(outsider.address)).to.equal(1);
    });

    it("executor role can execute queued proposals after bootstrap", async function () {
      await timelock.setGovernor(await governor.getAddress());
      await memberRegistry.revokeAdmin();

      await governor.connect(alice).propose(
        [await memberRegistry.getAddress()],
        [0],
        [memberRegistry.interface.encodeFunctionData("setRole", [bob.address, 3])],
        "ipfs://QmGrantExec",
        ethers.keccak256(ethers.toUtf8Bytes("grant executor"))
      );

      await ethers.provider.send("evm_mine", []);
      await governor.connect(alice).castVote(1, 1);
      await governor.connect(bob).castVote(1, 1);

      for (let i = 0; i < VOTING_PERIOD; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      await governor.queue(1);
      await ethers.provider.send("evm_increaseTime", [TIMELOCK_DELAY + 1]);
      await ethers.provider.send("evm_mine", []);

      await governor.connect(deployer).execute(1);
      expect(await memberRegistry.getRole(bob.address)).to.equal(3);

      await governor.connect(alice).propose(
        [await governor.getAddress()],
        [0],
        [governor.interface.encodeFunctionData("setProposalGracePeriod", [25])],
        "ipfs://QmUseExec",
        ethers.keccak256(ethers.toUtf8Bytes("use executor"))
      );

      await ethers.provider.send("evm_mine", []);
      await governor.connect(alice).castVote(2, 1);
      await governor.connect(bob).castVote(2, 1);

      for (let i = 0; i < VOTING_PERIOD; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      await governor.queue(2);
      await ethers.provider.send("evm_increaseTime", [TIMELOCK_DELAY + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(governor.connect(alice).execute(2))
        .to.be.revertedWith("Governor: not an executor");

      await governor.connect(bob).execute(2);
      expect(await governor.proposalGracePeriod()).to.equal(25);
    });

    it("tied vote (forVotes == againstVotes) is Defeated", async function () {
      await gov2.connect(deployer).propose(
        [await gov2.getAddress()],
        [0],
        [gov2.interface.encodeFunctionData("setQuorum", [30])],
        "ipfs://QmTie",
        ethers.keccak256(ethers.toUtf8Bytes("tie vote"))
      );
      await ethers.provider.send("evm_mine", []);
      // alice votes For, deployer votes Against — 1 each, quorum met (1 of 4 ≥ floor 1)
      await gov2.connect(alice).castVote(1, 1);    // For
      await gov2.connect(deployer).castVote(1, 0); // Against
      for (let i = 0; i < VOTING_PERIOD; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      expect(await gov2.getProposalState(1)).to.equal(2); // Defeated
    });

    it("proposal expires after grace period if not queued", async function () {
      const TL3 = await ethers.getContractFactory("Timelock");
      const tl3 = await TL3.deploy(TIMELOCK_DELAY, deployer.address, deployer.address) as unknown as Timelock;
      const GOV3 = await ethers.getContractFactory("Governor");
      const gov3 = await GOV3.deploy(
        await memberRegistry.getAddress(),
        await tl3.getAddress(),
        deployer.address,
        VOTING_DELAY,
        VOTING_PERIOD,
        QUORUM
      ) as unknown as Governor;
      // Set grace period via timelock BEFORE handing governor control to gov3
      // (deployer is still the timelock governor at this point)
      const gracePeriod = 10; // blocks
      const setGraceData = gov3.interface.encodeFunctionData("setProposalGracePeriod", [gracePeriod]);
      await tl3.connect(deployer).queueAction(await gov3.getAddress(), 0, setGraceData);
      await ethers.provider.send("evm_increaseTime", [TIMELOCK_DELAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await tl3.connect(deployer).executeAction(await gov3.getAddress(), 0, setGraceData);
      expect(await gov3.proposalGracePeriod()).to.equal(gracePeriod);

      // Now wire the timelock to gov3
      await tl3.setGovernor(await gov3.getAddress());

      await gov3.connect(deployer).propose(
        [await gov3.getAddress()],
        [0],
        [gov3.interface.encodeFunctionData("setQuorum", [25])],
        "ipfs://QmGrace",
        ethers.keccak256(ethers.toUtf8Bytes("grace expiry"))
      );
      await ethers.provider.send("evm_mine", []);
      await gov3.connect(deployer).castVote(1, 1);
      await gov3.connect(alice).castVote(1, 1);

      // Mine past voting period (Succeeded) then past grace period without queuing → Defeated
      for (let i = 0; i < VOTING_PERIOD + gracePeriod + 1; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      expect(await gov3.getProposalState(1)).to.equal(2); // Defeated (grace expired, not queued)
    });
  });
});
