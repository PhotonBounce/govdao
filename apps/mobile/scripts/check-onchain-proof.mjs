/**
 * QA gate: validates the OnchainProofCard trust selector — it must list every
 * genuinely-deployed contract and must NEVER surface placeholder/zero addresses
 * (which would falsely claim a demo build is live on mainnet).
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", jsx: "react-jsx", resolveJsonModule: true, esModuleInterop: true },
});

const srcDir = path.resolve(process.cwd(), "src");
const { liveContracts } = require(path.join(srcDir, "data", "onchainProof.ts"));
const liveManifest = require(path.join(srcDir, "data", "app.manifest.json"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

const ZERO = "0x0000000000000000000000000000000000000000";

console.log("\nOnchainProof: live manifest");
const live = liveContracts(liveManifest);
assert("lists at least the core governor + treasury", live.some((c) => c.label === "Governor") && live.some((c) => c.label === "Treasury"), JSON.stringify(live.map((c) => c.label)));
assert("every listed address is non-placeholder", live.every((c) => !/example\.|your_/i.test(c.address) && !/^0x0{40}$/i.test(c.address)));
assert("every listed address looks like an EVM address", live.every((c) => /^0x[0-9a-fA-F]{40}$/.test(c.address)));

console.log("\nOnchainProof: placeholder manifest hides the badge");
const placeholderManifest = {
  ...liveManifest,
  contracts: { memberRegistry: ZERO, timelock: ZERO, governor: ZERO, treasury: ZERO, emergencyGuardian: ZERO },
};
assert("returns empty list when all contracts are zero", liveContracts(placeholderManifest).length === 0);

console.log("\nOnchainProof: partial deployment still surfaces real ones");
const partial = {
  ...liveManifest,
  contracts: { ...liveManifest.contracts, governor: liveManifest.contracts.governor, treasury: ZERO, memberRegistry: ZERO, timelock: ZERO, emergencyGuardian: ZERO },
};
const partialLive = liveContracts(partial);
assert("only the non-zero contract is listed", partialLive.length === 1 && partialLive[0].label === "Governor");

console.log(`\ncheck-onchain-proof: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
