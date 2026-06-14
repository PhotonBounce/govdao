/**
 * QA gate: validates deploySource fixture path returns valid addresses and manifest fragment.
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
const { deployStep, buildManifestFragment, DEPLOY_STEPS } = require(path.join(rootPath, "deploySource.ts"));

let passed = 0, failed = 0;
function assert(label, condition, detail = "") {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

console.log("\nDeployWizard: DEPLOY_STEPS array");
assert("DEPLOY_STEPS has 5 entries", DEPLOY_STEPS.length === 5, `got ${DEPLOY_STEPS.length}`);
for (const step of DEPLOY_STEPS) {
  assert(`step "${step.name}" has description`, step.description.length >= 10);
}

console.log("\nDeployWizard: fixture deployStep");
const results = [];
for (let i = 0; i < 5; i++) {
  const phases = [];
  const result = await deployStep(i, manifest, (p) => phases.push(p));
  assert(`step ${i} (${result.contractName}) returns address`, ADDRESS_RE.test(result.address), `got ${result.address}`);
  assert(`step ${i} returns txHash`, TX_HASH_RE.test(result.txHash), `got ${result.txHash}`);
  assert(`step ${i} phases include deploying+deployed`, phases.includes("deploying") && phases.includes("deployed"), `got ${phases.join(",")}`);
  assert(`step ${i} transport is fixture`, result.transport === "fixture");
  results.push(result);
}

console.log("\nDeployWizard: buildManifestFragment");
const fragment = buildManifestFragment(results);
assert("fragment.contracts.memberRegistry is address", ADDRESS_RE.test(fragment.contracts.memberRegistry));
assert("fragment.contracts.governor is address", ADDRESS_RE.test(fragment.contracts.governor));
assert("fragment.contracts.treasury is address", ADDRESS_RE.test(fragment.contracts.treasury));
assert("fragment.contracts.timelock is address", ADDRESS_RE.test(fragment.contracts.timelock));
assert("fragment.contracts.emergencyGuardian is address", ADDRESS_RE.test(fragment.contracts.emergencyGuardian));

console.log(`\ncheck-deploy-wizard: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
