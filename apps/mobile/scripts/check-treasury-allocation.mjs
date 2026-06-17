/** QA gate: treasury allocation math. */
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
require("ts-node").register({ transpileOnly: true, skipProject: true, compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", esModuleInterop: true } });
const a = require(path.resolve(process.cwd(), "src", "data", "treasuryAllocationSource.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") { if (cond) { console.log(`  ✓ ${label}`); passed++; } else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; } }

console.log("\nAllocation: computeAllocation");
const slices = a.computeAllocation([
  { symbol: "ETH", label: "Ether", amount: 10, valueUsd: 30000 },
  { symbol: "USDC", label: "USD Coin", amount: 10000, valueUsd: 10000 },
]);
assert("returns a slice per holding", slices.length === 2);
assert("sorted by value desc", slices[0].symbol === "ETH" && slices[1].symbol === "USDC");
assert("pcts sum to ~100", Math.abs(slices.reduce((s, x) => s + x.pct, 0) - 100) < 0.5, String(slices.reduce((s, x) => s + x.pct, 0)));
assert("ETH is 75%", slices[0].pct === 75, String(slices[0].pct));
assert("each slice has a tone", slices.every((s) => ["pine", "bronze", "rose", "gold"].includes(s.tone)));

console.log("\nAllocation: edge cases");
const empty = a.computeAllocation([]);
assert("empty holdings → empty slices", empty.length === 0);
const zero = a.computeAllocation([{ symbol: "X", label: "X", amount: 0, valueUsd: 0 }]);
assert("zero value → 0 pct (no divide-by-zero)", zero[0].pct === 0);

console.log("\nAllocation: loadTreasuryAllocation fixture");
const t = a.loadTreasuryAllocation();
assert("fixture has 4 assets", t.slices.length === 4, String(t.slices.length));
assert("totalUsd is positive", t.totalUsd > 0);
assert("transport fixture", t.transport === "fixture");
assert("ETH is the largest slice", t.slices[0].symbol === "ETH");

console.log("\nAllocation: formatUsd");
assert("millions formatting", a.formatUsd(1_500_000) === "$1.50M");
assert("thousands formatting", a.formatUsd(12_300) === "$12.3K");
assert("small formatting", a.formatUsd(540) === "$540");

console.log(`\ncheck-treasury-allocation: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
