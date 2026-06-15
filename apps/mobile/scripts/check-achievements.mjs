/** QA gate: achievement evaluation + reputation tiers. */
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
require("ts-node").register({ transpileOnly: true, skipProject: true, compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", esModuleInterop: true } });
const a = require(path.resolve(process.cwd(), "src", "data", "achievementsSource.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") { if (cond) { console.log(`  ✓ ${label}`); passed++; } else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; } }

const EMPTY = { votesCast: 0, proposalsCreated: 0, quorumsReached: 0, drillsRun: 0, treasuryActions: 0, daysActive: 0 };

console.log("\nAchievements: shape");
const none = a.evaluateAchievements(EMPTY);
assert("at least 6 achievements", none.length >= 6, String(none.length));
assert("each has title + description + threshold", none.every((x) => x.title && x.description && x.threshold > 0));
assert("ids unique", new Set(none.map((x) => x.id)).size === none.length);
assert("none earned on empty stats", none.every((x) => x.earned === false));
assert("progress is 0 on empty stats", none.every((x) => x.progress === 0));

console.log("\nAchievements: earning");
const oneVote = a.evaluateAchievements({ ...EMPTY, votesCast: 1 });
assert("first-vote earned at 1 vote", oneVote.find((x) => x.id === "first-vote").earned === true);
assert("ten-votes not earned at 1 vote", oneVote.find((x) => x.id === "ten-votes").earned === false);
assert("ten-votes progress 10% at 1 vote", oneVote.find((x) => x.id === "ten-votes").progress === 10);

console.log("\nAchievements: progress caps at 100");
const over = a.evaluateAchievements({ ...EMPTY, votesCast: 50 });
assert("progress capped at 100", over.find((x) => x.id === "ten-votes").progress === 100);

console.log("\nAchievements: count + tiers");
assert("countEarned counts earned", a.countEarned(none) === 0 && a.countEarned(oneVote) >= 1);
assert("tier Observer at 0", a.reputationTier(0) === "Observer");
assert("tier Newcomer at 1", a.reputationTier(1) === "Newcomer");
assert("tier Legendary at 6+", a.reputationTier(6) === "Legendary" && a.reputationTier(7) === "Legendary");

console.log("\nAchievements: fixture member stats earn several");
const fix = a.evaluateAchievements(a.FIXTURE_MEMBER_STATS);
assert("fixture earns at least 4 badges", a.countEarned(fix) >= 4, String(a.countEarned(fix)));

console.log(`\ncheck-achievements: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
