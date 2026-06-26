/** QA gate: activity heatmap builder. */
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
require("ts-node").register({ transpileOnly: true, skipProject: true, compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", esModuleInterop: true } });
const h = require(path.resolve(process.cwd(), "src", "data", "activityHeatmapSource.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") { if (cond) { console.log(`  ✓ ${label}`); passed++; } else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; } }

console.log("\nHeatmap: intensityFor buckets");
assert("0 → 0", h.intensityFor(0) === 0);
assert("1 → 1", h.intensityFor(1) === 1);
assert("3 → 2", h.intensityFor(3) === 2);
assert("5 → 3", h.intensityFor(5) === 3);
assert("9 → 4", h.intensityFor(9) === 4);

console.log("\nHeatmap: buildHeatmap shape");
const map = h.buildHeatmap(12, 7);
assert("12 weeks * 7 = 84 cells", map.cells.length === 84, String(map.cells.length));
assert("each cell intensity 0-4", map.cells.every((c) => c.intensity >= 0 && c.intensity <= 4));
assert("each cell count >= 0", map.cells.every((c) => c.count >= 0));
assert("total equals sum of counts", map.total === map.cells.reduce((s, c) => s + c.count, 0));
assert("busiestCount is the max", map.busiestCount === Math.max(...map.cells.map((c) => c.count)));
assert("currentStreak >= 0", map.currentStreak >= 0);

console.log("\nHeatmap: determinism");
const a = h.buildHeatmap(12, 7);
const b = h.buildHeatmap(12, 7);
assert("same seed → identical grid", JSON.stringify(a.cells) === JSON.stringify(b.cells));
assert("different seed → different grid", JSON.stringify(h.buildHeatmap(12, 1).cells) !== JSON.stringify(a.cells));

console.log("\nHeatmap: weekColumns");
const cols = h.weekColumns(map);
assert("12 columns", cols.length === 12);
assert("each column has 7 days", cols.every((c) => c.length === 7));

console.log(`\ncheck-activity-heatmap: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
