import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
    target: "es2020",
    jsx: "react-jsx",
    resolveJsonModule: true,
    esModuleInterop: true
  }
});

const rootPath = path.resolve(process.cwd(), "src", "data");
const manifest = require(path.join(rootPath, "app.manifest.json"));
const { keccak256, verifyProposalDocument } = require(path.join(rootPath, "docVerification.ts"));
const { loadProposalChainState } = require(path.join(rootPath, "chainSource.ts"));
const { loadMobileDashboardData } = require(path.join(rootPath, "mobileDataSource.ts"));

const failures = [];

// Known keccak-256 vectors guard the dependency-free implementation.
const vectors = [
  ["", "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"],
  ["abc", "0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45"],
  ["The quick brown fox jumps over the lazy dog", "0x4d741b6f1eb29cb2a9b9911c82f56fa8d73b04959d3d9d222895df6c0b28aa15"]
];
for (const [input, expected] of vectors) {
  if (keccak256(input) !== expected) {
    failures.push(`keccak256 vector failed for input ${JSON.stringify(input)}`);
  }
}

const dashboard = await loadMobileDashboardData(manifest);
const results = [];

for (const proposal of dashboard.proposals) {
  const verification = await verifyProposalDocument(proposal.docUri, proposal.docHash);
  results.push({ id: proposal.id, onchainId: proposal.onchainId, doc: verification.status });

  if (verification.status !== "verified") {
    failures.push(`proposal ${proposal.id} document did not verify (${verification.status}: ${verification.detail})`);
  }
}

// A tampered anchor must be detected, otherwise verification is decorative.
const firstProposal = dashboard.proposals[0];
const tampered = await verifyProposalDocument(firstProposal.docUri, `0x${"11".repeat(32)}`);
if (tampered.status !== "mismatch") {
  failures.push(`tampered hash was not flagged (got ${tampered.status})`);
}

const chainState = await loadProposalChainState(manifest, firstProposal.onchainId);
if (process.env.CHAIN_RPC_URL || process.env.GOVERNOR_ADDRESS) {
  if (process.env.CHAIN_RPC_URL) {
    manifest.chain.rpcUrl = process.env.CHAIN_RPC_URL;
  }
  if (process.env.GOVERNOR_ADDRESS) {
    manifest.contracts.governor = process.env.GOVERNOR_ADDRESS;
  }
  const liveState = await loadProposalChainState(manifest, firstProposal.onchainId);
  if (!liveState.available) {
    failures.push(`live Governor state read failed: ${liveState.detail}`);
  }
  results.push({ liveChainState: liveState });
} else if (chainState.available) {
  failures.push("chain state reported available despite placeholder Governor configuration");
}

console.log(JSON.stringify({ results, tamperedDetected: tampered.status === "mismatch", chainFallback: chainState.detail }, null, 2));

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`Proposal check failed: ${failure}`);
  }
  process.exitCode = 1;
}
