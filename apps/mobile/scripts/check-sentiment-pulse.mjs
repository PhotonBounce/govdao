/** QA gate: governance sentiment pulse reactions. */
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
require("ts-node").register({ transpileOnly: true, skipProject: true, compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", esModuleInterop: true } });
const s = require(path.resolve(process.cwd(), "src", "data", "sentimentPulseSource.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") { if (cond) { console.log(`  ✓ ${label}`); passed++; } else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; } }

console.log("\nSentimentPulse: buildSentimentReactions");
const reactions = s.buildSentimentReactions({ fire: 10, thumbsUp: 5, warning: 2 });
assert("returns 5 reaction types", reactions.length === 5);
assert("fire count set", reactions.find((r) => r.type === "fire")?.count === 10);
assert("missing type defaults to 0", reactions.find((r) => r.type === "eyes")?.count === 0);
assert("each reaction has emoji", reactions.every((r) => r.emoji.length > 0));
assert("each reaction has label", reactions.every((r) => r.label.length > 0));

console.log("\nSentimentPulse: computeSentiment");
const bullish = s.computeSentiment(s.buildSentimentReactions({ fire: 50, thumbsUp: 30 }));
assert("all-fire score positive", bullish.score > 0, String(bullish.score));
assert("dominant is fire", bullish.dominant === "fire", bullish.dominant);

const bearish = s.computeSentiment(s.buildSentimentReactions({ warning: 50, thinking: 30 }));
assert("all-warning score negative", bearish.score < 0, String(bearish.score));

const empty = s.computeSentiment(s.buildSentimentReactions({}));
assert("empty reactions → score 0", empty.score === 0);

console.log("\nSentimentPulse: buildProposalSentiment");
const p = s.buildProposalSentiment("prop-x", { fire: 20, thumbsUp: 15, eyes: 5 });
assert("proposalId set", p.proposalId === "prop-x");
assert("totalReactions correct", p.totalReactions === 40, String(p.totalReactions));
assert("sentimentScore in -100 to 100", p.sentimentScore >= -100 && p.sentimentScore <= 100);

console.log("\nSentimentPulse: fixture data");
assert("3 fixture sentiments", s.FIXTURE_SENTIMENTS.length === 3);
assert("first fixture has high support", s.FIXTURE_SENTIMENTS[0].sentimentScore > 0);
assert("second fixture has low sentiment", s.FIXTURE_SENTIMENTS[1].sentimentScore < 0);
assert("sentimentLabel positive", s.sentimentLabel(70).length > 0);
assert("sentimentLabel neutral", s.sentimentLabel(0).length > 0);
assert("sentimentLabel negative", s.sentimentLabel(-70).length > 0);
assert("sentimentColor positive is green-ish", s.sentimentColor(50).startsWith("#"));
assert("sentimentColor negative is red-ish", s.sentimentColor(-70).startsWith("#"));

console.log(`\ncheck-sentiment-pulse: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
