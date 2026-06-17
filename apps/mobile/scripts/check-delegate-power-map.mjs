/** QA gate: delegate power map data and logic. */
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
require("ts-node").register({ transpileOnly: true, skipProject: true, compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", esModuleInterop: true } });
const d = require(path.resolve(process.cwd(), "src", "data", "delegatePowerMapSource.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") { if (cond) { console.log(`  ✓ ${label}`); passed++; } else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; } }

console.log("\nDelegatePowerMap: tier classification");
assert("weight 88 → whale", d.tierForWeight(88) === "whale");
assert("weight 65 → active", d.tierForWeight(65) === "active");
assert("weight 30 → delegate", d.tierForWeight(30) === "delegate");
assert("weight 5 → dormant", d.tierForWeight(5) === "dormant");
assert("whale has a color", d.tierColor("whale").startsWith("#"));
assert("dormant has a color", d.tierColor("dormant").startsWith("#"));

console.log("\nDelegatePowerMap: buildPowerMap");
const map = d.buildPowerMap(d.FIXTURE_DELEGATE_NODES);
assert("nodes preserved", map.nodes.length === d.FIXTURE_DELEGATE_NODES.length);
assert("top holder is Titan.eth", map.topHolder === "Titan.eth", map.topHolder);
assert("edges created from delegatedFrom", map.edges.length > 0);
assert("totalDelegated > 0", map.totalDelegated > 0, String(map.totalDelegated));

console.log("\nDelegatePowerMap: fixture data integrity");
assert("all nodes have label", d.FIXTURE_DELEGATE_NODES.every((n) => n.label.length > 0));
assert("all voteWeights 0–100", d.FIXTURE_DELEGATE_NODES.every((n) => n.voteWeight >= 0 && n.voteWeight <= 100));
assert("all tiers valid", d.FIXTURE_DELEGATE_NODES.every((n) => ["whale", "active", "delegate", "dormant"].includes(n.tier)));
assert("at least one whale", d.FIXTURE_DELEGATE_NODES.some((n) => n.tier === "whale"));
assert("fixture has 11 nodes", d.FIXTURE_DELEGATE_NODES.length === 11);

console.log(`\ncheck-delegate-power-map: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
