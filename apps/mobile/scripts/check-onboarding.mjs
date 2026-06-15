/** QA gate: onboarding step navigation logic. */
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
require("ts-node").register({ transpileOnly: true, skipProject: true, compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", esModuleInterop: true } });
const o = require(path.resolve(process.cwd(), "src", "data", "onboardingSource.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") { if (cond) { console.log(`  ✓ ${label}`); passed++; } else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; } }

console.log("\nOnboarding: steps");
assert("at least 4 steps", o.ONBOARDING_STEPS.length >= 4, String(o.ONBOARDING_STEPS.length));
assert("each step has title + body + glyph", o.ONBOARDING_STEPS.every((s) => s.title && s.body.length >= 10 && s.glyph));
assert("step ids unique", new Set(o.ONBOARDING_STEPS.map((s) => s.id)).size === o.ONBOARDING_STEPS.length);

console.log("\nOnboarding: navigation");
assert("first step is first", o.isFirstStep(0) === true && o.isFirstStep(1) === false);
assert("last step detection", o.isLastStep(o.ONBOARDING_STEPS.length - 1) === true && o.isLastStep(0) === false);
assert("nextStep advances and clamps", o.nextStep(0) === 1 && o.nextStep(o.ONBOARDING_STEPS.length - 1) === o.ONBOARDING_STEPS.length - 1);
assert("prevStep retreats and clamps", o.prevStep(2) === 1 && o.prevStep(0) === 0);
assert("clampStep bounds", o.clampStep(-5) === 0 && o.clampStep(999) === o.ONBOARDING_STEPS.length - 1);

console.log("\nOnboarding: progress");
assert("progress at first step", o.stepProgress(0) === Math.round((1 / o.ONBOARDING_STEPS.length) * 100));
assert("progress at last step is 100", o.stepProgress(o.ONBOARDING_STEPS.length - 1) === 100);

console.log(`\ncheck-onboarding: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
