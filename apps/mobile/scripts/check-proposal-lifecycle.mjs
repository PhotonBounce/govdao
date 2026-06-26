/**
 * QA gate: validates the proposal lifecycle source (queue/execute) in fixture mode
 * and the nextLifecycleAction state mapping. The live path is proven on a real chain
 * by check-onchain-e2e.
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
const { queueProposal, executeProposal, nextLifecycleAction } = require(path.join(dataDir, "proposalLifecycleSource.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

const TX_RE = /^0x[0-9a-fA-F]{64}$/;

async function main() {
  console.log("\nLifecycle: nextLifecycleAction state mapping");
  assert("Succeeded → queue", nextLifecycleAction("Succeeded") === "queue");
  assert("Queued → execute", nextLifecycleAction("Queued") === "execute");
  assert("Voting → null", nextLifecycleAction("Voting") === null);
  assert("Executed → null", nextLifecycleAction("Executed") === null);
  assert("Defeated → null", nextLifecycleAction("Defeated") === null);

  console.log("\nLifecycle: fixture queue");
  const placeholderManifest = { chain: { rpcUrl: "https://YOUR_RPC_ENDPOINT" }, contracts: { governor: "" } };
  const qPhases = [];
  const q = await queueProposal("5", placeholderManifest, (p) => qPhases.push(p));
  assert("queue action label", q.action === "queue");
  assert("queue transport fixture", q.transport === "fixture");
  assert("queue tx hash valid", TX_RE.test(q.txHash), q.txHash);
  assert("queue phased signing→pending", qPhases.includes("signing") && qPhases.includes("pending"), qPhases.join(","));

  console.log("\nLifecycle: fixture execute");
  const ePhases = [];
  const e = await executeProposal("5", placeholderManifest, (p) => ePhases.push(p));
  assert("execute action label", e.action === "execute");
  assert("execute transport fixture", e.transport === "fixture");
  assert("execute tx hash valid", TX_RE.test(e.txHash), e.txHash);

  console.log("\nLifecycle: deterministic but distinct hashes per action");
  assert("queue and execute hashes differ", q.txHash !== e.txHash);

  console.log(`\ncheck-proposal-lifecycle: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
