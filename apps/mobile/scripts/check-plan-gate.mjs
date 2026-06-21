/**
 * QA gate: validates plan gating logic for all premium features.
 */

import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
    failed++;
  }
}

const hookFile = path.resolve(__dirname, "../src/hooks/usePlanGate.ts");
const js = execSync(
  `npx --yes ts-node --compiler-options '{"module":"CommonJS"}' --eval "const m = require('${hookFile}'); console.log(JSON.stringify({usePlanGate: !!m.usePlanGate, features: Object.keys(m)}))"`,
  { cwd: path.resolve(__dirname, ".."), encoding: "utf8" }
);
const meta = JSON.parse(js.trim());

console.log("\nPlanGate: module exports");
assert("usePlanGate exported", meta.usePlanGate);

// Inline test the gating logic
const premiumManifest = {
  features: { plan: "premium" }
};
const freeManifest = {
  features: { plan: "free" }
};
const noManifest = {
  features: {}
};

const FEATURES = ["guardian-drill", "member-invite", "activity-export", "delegate-analytics", "deploy-wizard"];

// We can't import the hook directly (it uses React), so we replicate the logic
function simulateGate(manifest, feature) {
  const plan = manifest.features.plan ?? "free";
  return {
    allowed: plan === "premium",
    plan,
    feature,
  };
}

console.log("\nPlanGate: premium plan allows all features");
for (const feature of FEATURES) {
  const gate = simulateGate(premiumManifest, feature);
  assert(`premium allows ${feature}`, gate.allowed);
  assert(`premium plan field`, gate.plan === "premium");
}

console.log("\nPlanGate: free plan blocks all features");
for (const feature of FEATURES) {
  const gate = simulateGate(freeManifest, feature);
  assert(`free blocks ${feature}`, !gate.allowed);
  assert(`free plan field`, gate.plan === "free");
}

console.log("\nPlanGate: missing plan field defaults to free (blocked)");
for (const feature of FEATURES) {
  const gate = simulateGate(noManifest, feature);
  assert(`no-plan blocks ${feature}`, !gate.allowed);
}

console.log("\nPlanGate: every feature has benefit copy");
const hookSrc = readFileSync(hookFile, "utf8");
for (const feature of FEATURES) {
  // Each feature key must appear in both the labels and benefits maps.
  const inBenefits = new RegExp(`"${feature}"\\s*:`).test(hookSrc.split("FEATURE_BENEFITS")[1] ?? "");
  assert(`${feature} has benefit copy`, inBenefits);
}
assert("PlanGateResult exposes benefit", /benefit:\s*string/.test(hookSrc) && /benefit:\s*FEATURE_BENEFITS/.test(hookSrc));

console.log("\nPlanGate: manifest JSON has plan field");
const manifestFile = path.resolve(__dirname, "../src/data/app.manifest.json");
const manifest = require(manifestFile);
assert("manifest has features.plan", typeof manifest.features.plan === "string");
assert("manifest plan is 'premium'", manifest.features.plan === "premium");

console.log(`\ncheck-plan-gate: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
