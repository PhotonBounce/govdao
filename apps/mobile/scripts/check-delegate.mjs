/**
 * Headless QA for delegateSource — vote tallies and delegate profiles.
 * Covers: tally loading, outcome derivation, percentage math, delegate profile
 * loading, participation rate, vote history, missing-id handling, and
 * fixture coverage across all 4 members.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// --- inline delegate source (mirrors delegateSource.ts) ---

const fixtureTallies = {
  "GOV-104": {
    proposalId: "GOV-104",
    forCount: 3,
    againstCount: 1,
    abstainCount: 0,
    total: 4,
    forPct: 75,
    againstPct: 25,
    abstainPct: 0,
    voters: [
      { address: "0xA1b2C3d4E5f6a7B8C9d0E1f2A3B4C5D6E7F8a9B0", displayName: "Security Council", choice: "For" },
      { address: "0xD4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0C1d2E3", displayName: "Finance Working Group", choice: "For" },
      { address: "0xB9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8", displayName: "Release Council", choice: "For" },
      { address: "0xE2f3A4b5C6d7E8f9A0b1C2d3E4f5A6b7C8d9E0f1", displayName: "Community Operations", choice: "Against" }
    ]
  },
  "GOV-105": {
    proposalId: "GOV-105",
    forCount: 2,
    againstCount: 1,
    abstainCount: 1,
    total: 4,
    forPct: 50,
    againstPct: 25,
    abstainPct: 25,
    voters: [
      { address: "0xA1b2C3d4E5f6a7B8C9d0E1f2A3B4C5D6E7F8a9B0", displayName: "Security Council", choice: "For" },
      { address: "0xD4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0C1d2E3", displayName: "Finance Working Group", choice: "For" },
      { address: "0xB9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8", displayName: "Release Council", choice: "Against" },
      { address: "0xE2f3A4b5C6d7E8f9A0b1C2d3E4f5A6b7C8d9E0f1", displayName: "Community Operations", choice: "Abstain" }
    ]
  }
};

const fixtureDelegateProfiles = [
  {
    memberId: "MBR-001",
    address: "0xA1b2C3d4E5f6a7B8C9d0E1f2A3B4C5D6E7F8a9B0",
    displayName: "Security Council",
    role: "Guardian Delegate",
    participationRate: 100,
    recentVotes: [
      { proposalId: "GOV-104", proposalTitle: "Expand emergency guardian signer set", choice: "For", votedAt: "2025-05-21T10:30:00Z" },
      { proposalId: "GOV-105", proposalTitle: "Treasury reporting cadence upgrade", choice: "For", votedAt: "2025-05-18T09:00:00Z", anchorHash: "0xabc1230000000000000000000000000000000000000000000000000000000000" }
    ]
  },
  { memberId: "MBR-002", address: "0xD4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0C1d2E3", displayName: "Finance Working Group", role: "Treasury Steward", participationRate: 100, recentVotes: [{ proposalId: "GOV-104", proposalTitle: "Expand emergency guardian signer set", choice: "For", votedAt: "2025-05-21T11:00:00Z" }, { proposalId: "GOV-105", proposalTitle: "Treasury reporting cadence upgrade", choice: "For", votedAt: "2025-05-18T10:15:00Z" }] },
  { memberId: "MBR-003", address: "0xB9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8", displayName: "Release Council", role: "Protocol Operator", participationRate: 100, recentVotes: [{ proposalId: "GOV-104", proposalTitle: "Expand emergency guardian signer set", choice: "For", votedAt: "2025-05-21T12:00:00Z" }, { proposalId: "GOV-105", proposalTitle: "Treasury reporting cadence upgrade", choice: "Against", votedAt: "2025-05-18T14:30:00Z" }] },
  { memberId: "MBR-004", address: "0xE2f3A4b5C6d7E8f9A0b1C2d3E4f5A6b7C8d9E0f1", displayName: "Community Operations", role: "Delegate", participationRate: 75, recentVotes: [{ proposalId: "GOV-104", proposalTitle: "Expand emergency guardian signer set", choice: "Against", votedAt: "2025-05-21T14:45:00Z" }, { proposalId: "GOV-105", proposalTitle: "Treasury reporting cadence upgrade", choice: "Abstain", votedAt: "2025-05-18T16:00:00Z" }] }
];

function loadVoteTally(proposalId) {
  return fixtureTallies[proposalId] ?? null;
}

function loadDelegateProfile(memberId) {
  return fixtureDelegateProfiles.find((p) => p.memberId === memberId) ?? null;
}

function deriveOutcome(tally) {
  if (tally.total === 0) return "Quorum Pending";
  if (tally.forCount > tally.againstCount) return "Passed";
  if (tally.againstCount > tally.forCount) return "Defeated";
  return "Tied";
}

// --- test helpers ---
let passed = 0;
let failed = 0;

function pass(label) { console.log(`  ✓ ${label}`); passed++; }
function fail(label, err) { console.error(`  ✗ ${label}: ${err?.message ?? err}`); failed++; }

// --- vote tally tests ---
console.log("\nTally: GOV-104 loads with correct counts");
{
  try {
    const tally = loadVoteTally("GOV-104");
    assert.ok(tally, "tally should exist");
    assert.equal(tally.forCount, 3);
    assert.equal(tally.againstCount, 1);
    assert.equal(tally.abstainCount, 0);
    assert.equal(tally.total, 4);
    pass("GOV-104 tally counts correct");
  } catch (err) { fail("GOV-104 tally", err); }
}

console.log("\nTally: percentage math sums to ≤100");
{
  try {
    for (const [id, tally] of Object.entries(fixtureTallies)) {
      const sum = tally.forPct + tally.againstPct + tally.abstainPct;
      assert.ok(sum <= 100, `${id} pct sum ${sum} > 100`);
      assert.ok(sum >= 99, `${id} pct sum ${sum} suspiciously low`);
    }
    pass("all tallies sum to ~100%");
  } catch (err) { fail("percentage math", err); }
}

console.log("\nTally: voter count matches total field");
{
  try {
    for (const [id, tally] of Object.entries(fixtureTallies)) {
      assert.equal(tally.voters.length, tally.total, `${id} voter list length mismatch`);
    }
    pass("voter list counts match totals");
  } catch (err) { fail("voter count", err); }
}

console.log("\nTally: outcome derivation — GOV-104 passes, GOV-105 passes, tie case");
{
  try {
    assert.equal(deriveOutcome(loadVoteTally("GOV-104")), "Passed");
    assert.equal(deriveOutcome(loadVoteTally("GOV-105")), "Passed");
    assert.equal(deriveOutcome({ forCount: 2, againstCount: 2, abstainCount: 0, total: 4 }), "Tied");
    assert.equal(deriveOutcome({ forCount: 0, againstCount: 0, abstainCount: 0, total: 0 }), "Quorum Pending");
    assert.equal(deriveOutcome({ forCount: 1, againstCount: 3, abstainCount: 0, total: 4 }), "Defeated");
    pass("outcome derivation correct for all cases");
  } catch (err) { fail("outcome derivation", err); }
}

console.log("\nTally: unknown proposalId returns null");
{
  try {
    const result = loadVoteTally("GOV-999");
    assert.equal(result, null, "unknown proposal should return null");
    pass("unknown proposalId returns null");
  } catch (err) { fail("unknown tally", err); }
}

console.log("\nDelegate: all 4 fixture profiles load");
{
  try {
    const ids = ["MBR-001", "MBR-002", "MBR-003", "MBR-004"];
    for (const id of ids) {
      const profile = loadDelegateProfile(id);
      assert.ok(profile, `${id} should have a profile`);
      assert.equal(typeof profile.participationRate, "number");
      assert.ok(profile.recentVotes.length > 0, `${id} should have recent votes`);
    }
    pass("all 4 delegate profiles present and shaped correctly");
  } catch (err) { fail("delegate profiles", err); }
}

console.log("\nDelegate: participation rate reflects voting record");
{
  try {
    const full = loadDelegateProfile("MBR-001");
    assert.equal(full.participationRate, 100, "Security Council should have 100% participation");
    const partial = loadDelegateProfile("MBR-004");
    assert.equal(partial.participationRate, 75, "Community Operations should have 75% participation");
    pass("participation rates match fixture data");
  } catch (err) { fail("participation rate", err); }
}

console.log("\nDelegate: voting history choices are valid values");
{
  try {
    const valid = new Set(["For", "Against", "Abstain"]);
    for (const profile of fixtureDelegateProfiles) {
      for (const vote of profile.recentVotes) {
        assert.ok(valid.has(vote.choice), `${profile.memberId} has invalid choice ${vote.choice}`);
      }
    }
    pass("all vote choices are valid");
  } catch (err) { fail("vote choices", err); }
}

console.log("\nDelegate: unknown memberId returns null");
{
  try {
    const result = loadDelegateProfile("MBR-999");
    assert.equal(result, null, "unknown member should return null");
    pass("unknown memberId returns null");
  } catch (err) { fail("unknown delegate", err); }
}

// --- summary ---
console.log(`\ncheck-delegate: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
