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
const liveManifest = require(path.join(dataDir, "app.manifest.json"));
const { loadLiveProposals } = require(path.join(dataDir, "chainSource.ts"));

// This gate validates fixture-mode degradation ONLY; the live read path is proven
// against a real chain by check-onchain-e2e. Build an explicit fixture manifest so
// the test stays deterministic after the checked-in manifest is pointed at a live
// deployment. Otherwise loadLiveProposals would spin up a real JsonRpcProvider and
// hang the process on network detection (and the "unavailable" assertions would no
// longer hold).
const manifest = {
  ...liveManifest,
  chain: { ...liveManifest.chain, rpcUrl: "https://rpc.example.com" },
  contracts: { ...liveManifest.contracts, governor: "0x0000000000000000000000000000000000000000" },
};

let passed = 0, failed = 0;
function assert(label, cond, detail = "") {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

async function main() {
  console.log("\nLiveProposals: fixture-mode degradation");
  const result = await loadLiveProposals(manifest);
  assert("returns an object with the expected shape", result && typeof result === "object" && "available" in result && "proposals" in result);
  assert("unavailable in fixture mode", result.available === false, String(result.available));
  assert("empty proposals array in fixture mode", Array.isArray(result.proposals) && result.proposals.length === 0);
  assert("detail explains the placeholder state", typeof result.detail === "string" && result.detail.length > 10, result.detail);

  console.log("\nLiveProposals: respects custom limit without throwing");
  const limited = await loadLiveProposals(manifest, 3);
  assert("limited call still returns clean unavailable result", limited.available === false && limited.proposals.length === 0);

  console.log(`\ncheck-live-proposals: ${passed} passed, ${failed} failed`);
  // Force a clean exit: even with the fixture manifest above, any stray network
  // handle must never keep the process (and therefore the CI step) alive.
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
