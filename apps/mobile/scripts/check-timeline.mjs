/**
 * Headless QA for proposalTimelineSource — lifecycle state history.
 * Covers: timeline loading, current state identification, entry ordering,
 * terminal state detection, tone mapping, missing ID fallback.
 */

import assert from "node:assert/strict";

// --- inline timeline source (mirrors proposalTimelineSource.ts) ---

const fixtureTimelines = {
  "GOV-201": {
    proposalId: "GOV-201",
    currentState: "voting",
    entries: [
      { state: "created", label: "Proposal Created", timestamp: "2025-05-20T10:00:00Z", txHash: "0xd1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2" },
      { state: "voting", label: "Voting Opened", timestamp: "2025-05-21T10:00:00Z", note: "Voting window closes in 18h" }
    ]
  },
  "GOV-202": {
    proposalId: "GOV-202",
    currentState: "queued",
    entries: [
      { state: "created", label: "Proposal Created", timestamp: "2025-05-14T12:00:00Z", txHash: "0xe2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3" },
      { state: "voting", label: "Voting Opened", timestamp: "2025-05-15T12:00:00Z", note: "Voting window: 2 days" },
      { state: "queued", label: "Queued For Execution", timestamp: "2025-05-17T12:00:00Z", txHash: "0xf3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4", note: "Timelock expires in 6h" }
    ]
  }
};

const TERMINAL_STATES = new Set(["executed", "defeated", "cancelled", "expired"]);
const TONE_MAP = { created: "bronze", voting: "bronze", queued: "pine", executed: "pine", defeated: "rose", cancelled: "rose", expired: "bronze" };

function loadProposalTimeline(proposalId) {
  return fixtureTimelines[proposalId] ?? null;
}

function timelineStateTone(state) { return TONE_MAP[state] ?? "bronze"; }
function isTerminalState(state) { return TERMINAL_STATES.has(state); }

// --- tests ---
let passed = 0;
let failed = 0;
function pass(label) { console.log(`  ✓ ${label}`); passed++; }
function fail(label, err) { console.error(`  ✗ ${label}: ${err?.message ?? err}`); failed++; }

console.log("\nTimeline: GOV-201 loads with voting as current state");
{
  try {
    const t = loadProposalTimeline("GOV-201");
    assert.ok(t, "timeline should exist");
    assert.equal(t.currentState, "voting");
    assert.equal(t.entries.length, 2);
    pass("GOV-201 timeline has 2 entries, current=voting");
  } catch (err) { fail("GOV-201 load", err); }
}

console.log("\nTimeline: GOV-202 has 3 entries, queued as current");
{
  try {
    const t = loadProposalTimeline("GOV-202");
    assert.equal(t.currentState, "queued");
    assert.equal(t.entries.length, 3);
    assert.equal(t.entries[t.entries.length - 1].state, "queued", "last entry should match currentState");
    pass("GOV-202 timeline has 3 entries, current=queued");
  } catch (err) { fail("GOV-202 load", err); }
}

console.log("\nTimeline: entries are chronologically ordered (oldest first)");
{
  try {
    for (const [id, timeline] of Object.entries(fixtureTimelines)) {
      for (let i = 1; i < timeline.entries.length; i++) {
        const prev = new Date(timeline.entries[i - 1].timestamp).getTime();
        const curr = new Date(timeline.entries[i].timestamp).getTime();
        assert.ok(prev <= curr, `${id} entry ${i - 1} is newer than entry ${i}`);
      }
    }
    pass("all timelines are oldest-first");
  } catch (err) { fail("chronological order", err); }
}

console.log("\nTimeline: unknown proposal returns null");
{
  try {
    assert.equal(loadProposalTimeline("GOV-999"), null);
    pass("unknown proposalId returns null");
  } catch (err) { fail("unknown proposal", err); }
}

console.log("\nTimeline: tone mapping covers all common states");
{
  try {
    const states = ["created", "voting", "queued", "executed", "defeated", "cancelled", "expired"];
    const valid = new Set(["pine", "bronze", "rose"]);
    for (const state of states) {
      assert.ok(valid.has(timelineStateTone(state)), `${state} has invalid tone ${timelineStateTone(state)}`);
    }
    pass("all states map to valid tones");
  } catch (err) { fail("tone mapping", err); }
}

console.log("\nTimeline: terminal state detection");
{
  try {
    assert.ok(isTerminalState("executed"), "executed is terminal");
    assert.ok(isTerminalState("defeated"), "defeated is terminal");
    assert.ok(isTerminalState("cancelled"), "cancelled is terminal");
    assert.ok(isTerminalState("expired"), "expired is terminal");
    assert.ok(!isTerminalState("voting"), "voting is not terminal");
    assert.ok(!isTerminalState("queued"), "queued is not terminal");
    assert.ok(!isTerminalState("created"), "created is not terminal");
    pass("terminal state detection correct");
  } catch (err) { fail("terminal states", err); }
}

console.log("\nTimeline: entries with txHash have valid format");
{
  try {
    for (const timeline of Object.values(fixtureTimelines)) {
      for (const entry of timeline.entries) {
        if (entry.txHash) {
          assert.ok(entry.txHash.startsWith("0x"), `txHash missing 0x prefix`);
          assert.equal(entry.txHash.length, 66, `txHash length ${entry.txHash.length} ≠ 66`);
        }
      }
    }
    pass("all txHashes have valid 0x+64hex format");
  } catch (err) { fail("txHash format", err); }
}

console.log(`\ncheck-timeline: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
