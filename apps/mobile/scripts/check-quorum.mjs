/**
 * Headless QA for quorumSource — quorum computation and summary logic.
 * Covers: quorum threshold math, reached/not-reached, percentage,
 * quorum labels, governance summary across multiple proposals.
 */

import assert from "node:assert/strict";

// --- inline quorum source (mirrors quorumSource.ts) ---

function computeQuorum(tally, totalMembers, requiredPct = 50) {
  const required = Math.ceil((totalMembers * requiredPct) / 100);
  const reached = tally.total >= required;
  const pct = totalMembers > 0 ? Math.round((tally.total / totalMembers) * 100) : 0;
  return { proposalId: tally.proposalId, required, totalMembers, voted: tally.total, reached, pct };
}

function quorumLabel(status) {
  return status.reached
    ? `Quorum met — ${status.voted} of ${status.totalMembers} voted`
    : `Quorum pending — ${status.voted} of ${status.required} required`;
}

function summarizeGovernanceQuorum(proposalIds, tallyFn, totalMembers) {
  let atQuorum = 0;
  let belowQuorum = 0;
  for (const id of proposalIds) {
    const tally = tallyFn(id);
    if (!tally) continue;
    const status = computeQuorum(tally, totalMembers);
    if (status.reached) atQuorum++;
    else belowQuorum++;
  }
  return { totalMembers, activeProposalCount: proposalIds.length, proposalsAtQuorum: atQuorum, proposalsBelowQuorum: belowQuorum };
}

let passed = 0;
let failed = 0;
function pass(label) { console.log(`  ✓ ${label}`); passed++; }
function fail(label, err) { console.error(`  ✗ ${label}: ${err?.message ?? err}`); failed++; }

const TOTAL_MEMBERS = 10;

console.log("\nComputeQuorum: exactly at quorum threshold");
{
  try {
    const tally = { proposalId: "GOV-001", total: 5, forVotes: 3, againstVotes: 2, abstainVotes: 0 };
    const status = computeQuorum(tally, TOTAL_MEMBERS);
    assert.equal(status.required, 5, "required should be 5 (50% of 10)");
    assert.equal(status.voted, 5);
    assert.equal(status.reached, true, "quorum should be reached at threshold");
    assert.equal(status.pct, 50);
    pass("quorum reached at exactly 50%");
  } catch (err) { fail("at-threshold quorum", err); }
}

console.log("\nComputeQuorum: one below threshold → not reached");
{
  try {
    const tally = { proposalId: "GOV-001", total: 4, forVotes: 3, againstVotes: 1, abstainVotes: 0 };
    const status = computeQuorum(tally, TOTAL_MEMBERS);
    assert.equal(status.reached, false);
    assert.equal(status.pct, 40);
    pass("quorum not reached below threshold");
  } catch (err) { fail("below-threshold quorum", err); }
}

console.log("\nComputeQuorum: zero members → pct is 0");
{
  try {
    const tally = { proposalId: "GOV-001", total: 0, forVotes: 0, againstVotes: 0, abstainVotes: 0 };
    const status = computeQuorum(tally, 0);
    assert.equal(status.pct, 0);
    pass("zero members → pct is 0");
  } catch (err) { fail("zero members", err); }
}

console.log("\nComputeQuorum: odd total members rounds required up");
{
  try {
    // 50% of 9 = 4.5 → ceil = 5
    const tally = { proposalId: "GOV-001", total: 4, forVotes: 3, againstVotes: 1, abstainVotes: 0 };
    const status = computeQuorum(tally, 9);
    assert.equal(status.required, 5, "should ceil to 5");
    assert.equal(status.reached, false, "4 < 5 so not reached");
    pass("odd members ceiling rounds up correctly");
  } catch (err) { fail("odd members ceiling", err); }
}

console.log("\nQuorumLabel: met label format");
{
  try {
    const status = { proposalId: "GOV-001", required: 5, totalMembers: 10, voted: 7, reached: true, pct: 70 };
    const label = quorumLabel(status);
    assert.ok(label.includes("Quorum met"), "label should say Quorum met");
    assert.ok(label.includes("7"), "label should include voted count");
    assert.ok(label.includes("10"), "label should include total members");
    pass("quorum-met label correct");
  } catch (err) { fail("quorum-met label", err); }
}

console.log("\nQuorumLabel: pending label format");
{
  try {
    const status = { proposalId: "GOV-001", required: 5, totalMembers: 10, voted: 3, reached: false, pct: 30 };
    const label = quorumLabel(status);
    assert.ok(label.includes("Quorum pending"), "label should say Quorum pending");
    assert.ok(label.includes("3"), "label should include voted count");
    assert.ok(label.includes("5"), "label should include required count");
    pass("quorum-pending label correct");
  } catch (err) { fail("quorum-pending label", err); }
}

console.log("\nSummarize: mixed quorum state across proposals");
{
  try {
    const tallies = {
      "GOV-A": { proposalId: "GOV-A", total: 6, forVotes: 4, againstVotes: 2, abstainVotes: 0 },
      "GOV-B": { proposalId: "GOV-B", total: 2, forVotes: 2, againstVotes: 0, abstainVotes: 0 },
      "GOV-C": { proposalId: "GOV-C", total: 8, forVotes: 5, againstVotes: 3, abstainVotes: 0 }
    };
    const summary = summarizeGovernanceQuorum(["GOV-A", "GOV-B", "GOV-C"], (id) => tallies[id] ?? null, 10);
    assert.equal(summary.activeProposalCount, 3);
    assert.equal(summary.proposalsAtQuorum, 2, "GOV-A and GOV-C meet quorum (6≥5, 8≥5)");
    assert.equal(summary.proposalsBelowQuorum, 1, "GOV-B does not (2<5)");
    assert.equal(summary.totalMembers, 10);
    pass("governance quorum summary correct");
  } catch (err) { fail("governance summary", err); }
}

console.log(`\ncheck-quorum: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
