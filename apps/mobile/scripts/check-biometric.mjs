/**
 * QA gate: validates biometric config — manifest gating, prompt reasons, and the
 * status descriptions. The native expo-local-authentication integration is
 * platform-split (useBiometricGate.native.ts) and never enters the web build.
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", esModuleInterop: true },
});

const dataDir = path.resolve(process.cwd(), "src", "data");
const bio = require(path.join(dataDir, "biometricConfig.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

console.log("\nBiometric: manifest gating");
assert("required when biometricConfirm true", bio.biometricRequired({ features: { biometricConfirm: true } }) === true);
assert("not required when false", bio.biometricRequired({ features: { biometricConfirm: false } }) === false);
assert("not required when absent", bio.biometricRequired({ features: {} }) === false);

console.log("\nBiometric: prompt reasons");
for (const action of ["queue", "execute", "vote", "propose"]) {
  const reason = bio.biometricPromptReason(action);
  assert(`'${action}' has a confirm reason`, typeof reason === "string" && reason.toLowerCase().includes("confirm"), reason);
}

console.log("\nBiometric: status descriptions");
assert("optional copy when not required", /optional/i.test(bio.describeBiometricStatus({ required: false, available: false, enrolled: false, detail: "" })));
assert("no-hardware copy", /hardware/i.test(bio.describeBiometricStatus({ required: true, available: false, enrolled: false, detail: "" })));
assert("not-enrolled copy", /enroll/i.test(bio.describeBiometricStatus({ required: true, available: true, enrolled: false, detail: "" })));
assert("active copy when required + available + enrolled", /confirm with biometrics/i.test(bio.describeBiometricStatus({ required: true, available: true, enrolled: true, detail: "" })));

console.log("\nBiometric: web status shape");
assert("WEB_BIOMETRIC_STATUS never blocks (not required, not available)", bio.WEB_BIOMETRIC_STATUS.required === false && bio.WEB_BIOMETRIC_STATUS.available === false);

console.log(`\ncheck-biometric: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
