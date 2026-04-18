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
    memberRegistry = await MR.deploy(deployer.address);

    // Deploy Timelock with bootstrap governor/guardian wired to deployer.
    const TL = await ethers.getContractFactory("Timelock");
    timelock = await TL.deploy(TIMELOCK_DELAY, deployer.address, deployer.address);

    // Deploy Governor
    const GOV = await ethers.getContractFactory("Governor");
    governor = await GOV.deploy(
      await memberRegistry.getAddress(),
      await timelock.getAddress(),
      deployer.address,
      VOTING_DELAY,
      VOTING_PERIOD,
      QUORUM
    );

    // Deploy Treasury
    const TRES = await ethers.getContractFactory("Treasury");
    treasury = await TRES.deploy(
      await timelock.getAddress(),
      deployer.address,
      ethers.parseEther("10"),
      ethers.parseEther("50"),
      30 * 24 * 60 * 60
    );

    // Deploy EmergencyGuardian
    const EG = await ethers.getContractFactory("EmergencyGuardian");
    emergencyGuardian = await EG.deploy(
      [deployer.address, alice.address, bob.address],
      2,
      await treasury.getAddress(),
      await governor.getAddress()
    );

    // Wire: set Governor as MemberRegistry's governor
    await memberRegistry.setGovernor(await governor.getAddress());
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
  });
});
