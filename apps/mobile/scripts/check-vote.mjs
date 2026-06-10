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
const { connectSession, getAccessOptions } = require(path.join(rootPath, "sessionSource.ts"));
const { castVoteTransaction } = require(path.join(rootPath, "voteSource.ts"));
const { loadMobileDashboardData } = require(path.join(rootPath, "mobileDataSource.ts"));

const options = getAccessOptions(manifest);
const walletOption = options.find((option) => option.kind === "wallet");

if (!manifest.features.voting) {
  console.error("Vote check failed: features.voting is disabled in the active manifest.");
  process.exit(1);
}

if (!walletOption) {
  console.error("Vote check failed: no wallet access method is available to sign votes.");
  process.exit(1);
}

const identity = await connectSession(walletOption);
const dashboard = await loadMobileDashboardData(manifest);
const proposal = dashboard.proposals[0];

if (!proposal) {
  console.error("Vote check failed: the active feed returned no proposals to vote on.");
  process.exit(1);
}

const phases = [];
const receipt = await castVoteTransaction(proposal.id, "for", identity, (phase) => phases.push(phase));

console.log(JSON.stringify({
  proposal: { id: proposal.id, title: proposal.title },
  signer: { memberLabel: identity.memberLabel, method: identity.methodId },
  phases,
  receipt: {
    choice: receipt.choice,
    txHash: receipt.txHash,
    transport: receipt.transport
  }
}, null, 2));

if (!/^0x[0-9a-f]{64}$/.test(receipt.txHash) || phases.join(",") !== "signing,pending") {
  console.error("Vote check failed: the vote transaction returned an invalid receipt or skipped phases.");
  process.exitCode = 1;
}
