/** QA gate: proposal risk analyzer logic. */
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
require("ts-node").register({ transpileOnly: true, skipProject: true, compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", esModuleInterop: true } });
const r = require(path.resolve(process.cwd(), "src", "data", "proposalRiskSource.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") { if (cond) { console.log(`  ✓ ${label}`); passed++; } else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; } }

console.log("\nProposalRisk: level thresholds");
assert("75+ → CRITICAL", r.riskLevelForScore(80) === "CRITICAL");
assert("50–74 → HIGH", r.riskLevelForScore(60) === "HIGH");
assert("25–49 → MEDIUM", r.riskLevelForScore(35) === "MEDIUM");
assert("0–24 → LOW", r.riskLevelForScore(10) === "LOW");
assert("each level has a label", ["LOW", "MEDIUM", "HIGH", "CRITICAL"].every((l) => r.riskLabel(l).length > 0));
assert("each level has a color", ["LOW", "MEDIUM", "HIGH", "CRITICAL"].every((l) => r.riskColor(l).startsWith("#")));

console.log("\nProposalRisk: computeProposalRisk");
const safe = r.computeProposalRisk({ treasuryImpactPct: 5, daysUntilDeadline: 14, currentParticipationPct: 70, quorumRequiredPct: 50, proposerReputation: 95, isUpgradeProposal: false });
assert("safe inputs → LOW or MEDIUM", ["LOW", "MEDIUM"].includes(safe.level), safe.level);
assert("safe score in 0–100", safe.score >= 0 && safe.score <= 100);
assert("5 risk factors", safe.factors.length === 5);
assert("each factor score 0–100", safe.factors.every((f) => f.score >= 0 && f.score <= 100));
assert("has recommendation", safe.recommendation.length > 10);

const danger = r.computeProposalRisk({ treasuryImpactPct: 90, daysUntilDeadline: 0, currentParticipationPct: 10, quorumRequiredPct: 60, proposerReputation: 5, isUpgradeProposal: true });
assert("danger inputs → HIGH or CRITICAL", ["HIGH", "CRITICAL"].includes(danger.level), danger.level);
assert("danger score > safe score", danger.score > safe.score, `${danger.score} vs ${safe.score}`);

console.log("\nProposalRisk: upgrade factor");
const upgrade = r.computeProposalRisk({ ...r.FIXTURE_RISK_INPUTS, isUpgradeProposal: true });
const noUpgrade = r.computeProposalRisk({ ...r.FIXTURE_RISK_INPUTS, isUpgradeProposal: false });
assert("upgrade flag raises score", upgrade.score > noUpgrade.score, `${upgrade.score} vs ${noUpgrade.score}`);

console.log(`\ncheck-proposal-risk: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
