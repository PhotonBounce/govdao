/**
 * QA gate: validates loadLiveProposals degrades cleanly in fixture mode (no RPC /
 * placeholder Governor). The live read itself is proven against a real chain by
 * check-onchain-e2e.
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", resolveJsonModule: true, esModuleInterop: true },
});

const dataDir = path.resolve(process.cwd(), "src", "data");
const manifest = require(path.join(dataDir, "app.manifest.json"));
const { loadLiveProposals } = require(path.join(dataDir, "chainSource.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

async function main() {
  console.log("\nLiveProposals: fixture-mode degradation");
  const placeholderManifest = { chain: { rpcUrl: "https://YOUR_RPC_ENDPOINT" }, contracts: { governor: "" } };
  const result = await loadLiveProposals(placeholderManifest);
  assert("returns an object with the expected shape", result && typeof result === "object" && "available" in result && "proposals" in result);
  assert("unavailable in fixture mode", result.available === false, String(result.available));
  assert("empty proposals array in fixture mode", Array.isArray(result.proposals) && result.proposals.length === 0);
  assert("detail explains the placeholder state", typeof result.detail === "string" && result.detail.length > 10, result.detail);

  console.log("\nLiveProposals: respects custom limit without throwing");
  const limited = await loadLiveProposals(placeholderManifest, 3);
  assert("limited call still returns clean unavailable result", limited.available === false && limited.proposals.length === 0);

  console.log(`\ncheck-live-proposals: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
