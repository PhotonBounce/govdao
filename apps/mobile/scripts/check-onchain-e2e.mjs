/**
 * END-TO-END on-chain test of the mobile live data layer.
 *
 * Runs against a real EVM node (a Hardhat node in CI) with the GOVDAO contracts
 * actually deployed. It drives the SAME functions the app uses in production —
 * connectSession, loadOnchainSnapshot, submitProposalDraft, castVoteTransaction,
 * scheduleDrill — through real ethers transactions, proving the live paths work
 * against the deployed Solidity (not fixtures, not stubs).
 *
 * Required env:
 *   E2E_RPC_URL                 non-loopback RPC URL (so isFixtureMode is false)
 *   GOVERNOR_ADDRESS, MEMBER_REGISTRY_ADDRESS, TREASURY_ADDRESS,
 *   EMERGENCY_GUARDIAN_ADDRESS, TIMELOCK_ADDRESS
 *   E2E_SIGNER_KEY              private key of a member/proposer (Hardhat acct #0)
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", resolveJsonModule: true, esModuleInterop: true },
});

const { ethers } = require("ethers");
const dataDir = path.resolve(process.cwd(), "src", "data");
const baseManifest = require(path.join(dataDir, "app.manifest.json"));
const walletProvider = require(path.join(dataDir, "walletProvider.ts"));
const { getAccessOptions, connectSession } = require(path.join(dataDir, "sessionSource.ts"));
const { submitProposalDraft } = require(path.join(dataDir, "proposalCreationSource.ts"));
const { castVoteTransaction } = require(path.join(dataDir, "voteSource.ts"));
const { loadOnchainSnapshot } = require(path.join(dataDir, "chainSource.ts"));
const { scheduleDrill } = require(path.join(dataDir, "guardianDrillSource.ts"));
const { GOVERNOR_ABI } = require(path.join(dataDir, "contractAbis.ts"));

let passed = 0, failed = 0;
function assert(label, condition, detail = "") {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

function env(name) {
  const v = process.env[name];
  if (!v) { console.error(`Missing required env ${name}`); process.exit(2); }
  return v;
}

async function main() {
  const rpcUrl = env("E2E_RPC_URL");
  const manifest = {
    ...baseManifest,
    chain: { ...baseManifest.chain, rpcUrl },
    contracts: {
      memberRegistry: env("MEMBER_REGISTRY_ADDRESS"),
      timelock: env("TIMELOCK_ADDRESS"),
      governor: env("GOVERNOR_ADDRESS"),
      treasury: env("TREASURY_ADDRESS"),
      emergencyGuardian: env("EMERGENCY_GUARDIAN_ADDRESS"),
    },
  };

  console.log("\nE2E: environment is live (not fixture)");
  assert("isFixtureMode is false for live config", walletProvider.isFixtureMode(manifest) === false);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(env("E2E_SIGNER_KEY"), provider);
  const address = await wallet.getAddress();
  walletProvider.setActiveSigner(wallet, address);
  assert("active signer registered", walletProvider.getActiveSigner() !== null);

  console.log("\nE2E: connectSession reads live role from MemberRegistry");
  const options = getAccessOptions(manifest);
  const walletOption = options.find((o) => o.kind === "wallet") ?? options[0];
  const identity = await connectSession(walletOption, manifest);
  assert("session transport is remote", identity.transport === "remote", identity.transport);
  assert("session address matches signer", identity.address.toLowerCase() === address.toLowerCase());
  assert("role resolved on-chain (Admin/Proposer/Member)", ["Admin", "Proposer", "Member"].includes(identity.role), identity.role);

  console.log("\nE2E: loadOnchainSnapshot reads live treasury + registry");
  const snapshot = await loadOnchainSnapshot(manifest);
  assert("snapshot available", snapshot.available === true, snapshot.detail);
  assert("block number present", !!snapshot.blockNumber);
  assert("treasury balance present", snapshot.treasuryBalance !== null, String(snapshot.treasuryBalance));
  assert("member count >= 1", snapshot.memberCount !== null && Number(snapshot.memberCount) >= 1, String(snapshot.memberCount));
  assert("guardian pause state read", snapshot.guardianPaused !== null);

  console.log("\nE2E: submitProposalDraft creates a real on-chain proposal");
  const draft = {
    title: "E2E ratify integration checklist",
    summary: "End-to-end test proposal submitted through the mobile live layer against the deployed Governor.",
    docUri: "https://example.org/e2e-doc",
    docHash: "",
  };
  const phases = [];
  const result = await submitProposalDraft(draft, identity, manifest, (p) => phases.push(p));
  assert("proposal id is numeric", /^\d+$/.test(result.proposalId), result.proposalId);
  assert("tx hash is 0x+64hex", /^0x[0-9a-fA-F]{64}$/.test(result.txHash), result.txHash);
  assert("phases reached submitted", phases.includes("submitted"));

  // Verify it landed on-chain via getProposal.
  const governor = new ethers.Contract(manifest.contracts.governor, GOVERNOR_ABI, provider);
  const proposal = await governor.getProposal(result.proposalId);
  assert("on-chain proposer matches signer", proposal.proposer.toLowerCase() === address.toLowerCase());
  assert("on-chain metadataURI matches draft", proposal.metadataURI === draft.docUri, proposal.metadataURI);

  console.log("\nE2E: castVoteTransaction records a real vote");
  // votingDelay is 1 block; mine one so voting is open.
  await provider.send("evm_mine", []);
  const votePhases = [];
  const receipt = await castVoteTransaction(result.proposalId, "for", identity, manifest, (p) => votePhases.push(p));
  assert("vote transport remote", receipt.transport === "remote");
  assert("vote tx hash valid", /^0x[0-9a-fA-F]{64}$/.test(receipt.txHash), receipt.txHash);
  const hasVoted = await governor.hasVoted(result.proposalId, address);
  assert("governor.hasVoted true", hasVoted === true);
  const after = await governor.getProposal(result.proposalId);
  assert("forVotes incremented to 1", Number(after.forVotes) === 1, String(after.forVotes));

  console.log("\nE2E: guardian readiness check reads live signer set");
  const drill = await scheduleDrill(
    { drillType: "full-cycle", scheduledWindowHours: 24, notesForSigners: "E2E guardian readiness rehearsal" },
    identity,
    manifest,
    () => {}
  );
  assert("drill transport remote", drill.transport === "remote");
  assert("required signers >= 1 (read from guardian)", drill.requiredSigners >= 1, String(drill.requiredSigners));

  console.log(`\ncheck-onchain-e2e: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("E2E run threw:", err);
  process.exit(1);
});
