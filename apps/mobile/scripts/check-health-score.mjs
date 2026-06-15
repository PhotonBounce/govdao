/** QA gate: governance health score computation. */
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
require("ts-node").register({ transpileOnly: true, skipProject: true, compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", esModuleInterop: true } });
const h = require(path.resolve(process.cwd(), "src", "data", "healthScoreSource.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") { if (cond) { console.log(`  ✓ ${label}`); passed++; } else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; } }

console.log("\nHealth: grade thresholds");
assert("90 → A", h.gradeForScore(90) === "A");
assert("75 → B", h.gradeForScore(75) === "B");
assert("55 → C", h.gradeForScore(55) === "C");
assert("30 → D", h.gradeForScore(30) === "D");
assert("each grade has a label", ["A", "B", "C", "D"].every((g) => h.gradeLabel(g).length > 0));

console.log("\nHealth: computeHealthScore");
const strong = h.computeHealthScore({ participationRate: 90, passRate: 80, quorumDistance: 40, treasuryHealthy: true, guardianArmed: true });
assert("strong inputs score in 0–100", strong.score >= 0 && strong.score <= 100);
assert("strong inputs grade A or B", ["A", "B"].includes(strong.grade), strong.grade);
assert("5 weighted factors", strong.factors.length === 5);
assert("each factor 0–100", strong.factors.every((f) => f.value >= 0 && f.value <= 100));

const weak = h.computeHealthScore({ participationRate: 20, passRate: 10, quorumDistance: 0, treasuryHealthy: false, guardianArmed: false });
assert("weak inputs score lower than strong", weak.score < strong.score, `${weak.score} vs ${strong.score}`);
assert("weak inputs grade C or D", ["C", "D"].includes(weak.grade), weak.grade);

console.log("\nHealth: safety signals move the score");
const paused = h.computeHealthScore({ ...h.FIXTURE_HEALTH_INPUTS, treasuryHealthy: false });
const ok = h.computeHealthScore(h.FIXTURE_HEALTH_INPUTS);
assert("unhealthy treasury lowers score", paused.score < ok.score, `${paused.score} vs ${ok.score}`);
assert("fixture inputs produce a healthy score", ok.score >= 70, String(ok.score));

console.log(`\ncheck-health-score: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
