/**
 * QA gate: validates governance analytics data shape and value ranges.
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", resolveJsonModule: true, esModuleInterop: true }
});

const rootPath = path.resolve(process.cwd(), "src", "data");
const manifest = require(path.join(rootPath, "app.manifest.json"));
const { loadAnalytics } = require(path.join(rootPath, "analyticsSource.ts"));

let passed = 0, failed = 0;
function assert(label, condition, detail = "") {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

const analytics = loadAnalytics(manifest);

console.log("\nAnalytics: top-level shape");
assert("analytics object returned", !!analytics);
assert("avgParticipation in 0–100", analytics.avgParticipation >= 0 && analytics.avgParticipation <= 100, `got ${analytics.avgParticipation}`);
assert("passRate in 0–100", analytics.passRate >= 0 && analytics.passRate <= 100, `got ${analytics.passRate}`);
assert("totalProposals >= 3", analytics.totalProposals >= 3, `got ${analytics.totalProposals}`);
assert("totalVotes >= 10", analytics.totalVotes >= 10, `got ${analytics.totalVotes}`);
assert("avgQuorumDistance in 0–50", analytics.avgQuorumDistance >= 0 && analytics.avgQuorumDistance <= 50, `got ${analytics.avgQuorumDistance}`);
assert("transport is fixture or remote", ["fixture", "remote"].includes(analytics.transport));

console.log("\nAnalytics: participation history");
assert("participationHistory length >= 3", analytics.participationHistory.length >= 3, `got ${analytics.participationHistory.length}`);
for (const p of analytics.participationHistory) {
  assert(`${p.proposalId} has proposalId`, !!p.proposalId);
  assert(`${p.proposalId} rate in 0–100`, p.participationRate >= 0 && p.participationRate <= 100, `got ${p.participationRate}`);
  assert(`${p.proposalId} has passed bool`, typeof p.passed === "boolean");
  assert(`${p.proposalId} forVotes >= 0`, p.forVotes >= 0);
}

console.log("\nAnalytics: top delegates");
assert("topDelegates length >= 1", analytics.topDelegates.length >= 1, `got ${analytics.topDelegates.length}`);
for (const d of analytics.topDelegates) {
  assert(`${d.id} label present`, !!d.label);
  assert(`${d.id} participationRate in 0–100`, d.participationRate >= 0 && d.participationRate <= 100);
  assert(`${d.id} votesCount >= 0`, d.votesCount >= 0);
}

console.log(`\ncheck-analytics: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
