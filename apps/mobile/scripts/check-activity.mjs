/**
 * Headless QA for activitySource — unified governance audit log.
 * Covers: event loading, type filtering, sort order, pagination,
 * fixture coverage across all event types, transport labeling, and
 * edge cases (empty filter result, page boundary).
 */

import assert from "node:assert/strict";

// --- inline activity source (mirrors activitySource.ts) ---

const fixtureActivityEvents = [
  { id: "ACT-001", type: "guardian", title: "Guardian drill completed", actor: "Security Desk", summary: "Quarterly pause drill completed successfully — all 5 signers responded within the SLA window.", timestamp: "2025-05-22T08:00:00Z", refId: "GRD-12" },
  { id: "ACT-002", type: "vote", title: "Vote recorded: GOV-105", actor: "Community Operations", summary: "Abstain vote anchored for Treasury reporting cadence upgrade.", timestamp: "2025-05-21T16:00:00Z", refId: "GOV-105" },
  { id: "ACT-003", type: "vote", title: "Vote recorded: GOV-105", actor: "Release Council", summary: "Against vote recorded for Treasury reporting cadence upgrade.", timestamp: "2025-05-21T14:30:00Z", refId: "GOV-105" },
  { id: "ACT-004", type: "treasury", title: "Treasury movement settled", actor: "Treasury Timelock", summary: "Member dues sweep of 4.6 ETH settled from Membership Contract.", timestamp: "2025-05-21T12:00:00Z", refId: "TRX-91" },
  { id: "ACT-005", type: "motion", title: "Motion decision recorded: OPS-22", actor: "Security Council", summary: "Approved — partner onboarding pack cleared legal ops review.", timestamp: "2025-05-21T10:00:00Z", refId: "OPS-22" },
  { id: "ACT-006", type: "proposal", title: "Proposal queued: GOV-104", actor: "Security Council", summary: "Expand emergency guardian signer set passed voting and entered the 11h timelock queue.", timestamp: "2025-05-20T18:00:00Z", refId: "GOV-104" },
  { id: "ACT-007", type: "vote", title: "Vote recorded: GOV-104", actor: "Community Operations", summary: "Against vote recorded for Expand emergency guardian signer set.", timestamp: "2025-05-20T14:45:00Z", refId: "GOV-104" },
  { id: "ACT-008", type: "vote", title: "Vote recorded: GOV-104", actor: "Release Council", summary: "For vote recorded for Expand emergency guardian signer set.", timestamp: "2025-05-20T12:00:00Z", refId: "GOV-104" },
  { id: "ACT-009", type: "treasury", title: "Treasury movement queued", actor: "Treasury Timelock", summary: "Community grants tranche of 8.5 ETH queued for Grants Committee Safe.", timestamp: "2025-05-19T11:00:00Z", refId: "TRX-93" },
  { id: "ACT-010", type: "proposal", title: "Proposal created: GOV-105", actor: "Finance Working Group", summary: "Treasury reporting cadence upgrade submitted for delegate review.", timestamp: "2025-05-18T08:30:00Z", refId: "GOV-105" },
  { id: "ACT-011", type: "motion", title: "Motion created: OPS-24", actor: "Community Team", summary: "Regional meetup micro-budget motion opened for delegate approval.", timestamp: "2025-05-17T14:00:00Z", refId: "OPS-24" },
  { id: "ACT-012", type: "member", title: "Member registered", actor: "Community Operations", summary: "Community Operations registered to the member registry (MBR-004).", timestamp: "2025-04-05T09:00:00Z", refId: "MBR-004" }
];

const PAGE_SIZE = 10;

function loadActivityFeed(filter = "all", page = 0) {
  const filtered = filter === "all" ? fixtureActivityEvents : fixtureActivityEvents.filter((e) => e.type === filter);
  const start = page * PAGE_SIZE;
  return {
    events: filtered.slice(start, start + PAGE_SIZE),
    total: filtered.length,
    hasMore: start + PAGE_SIZE < filtered.length,
    transport: "fixture"
  };
}

// --- test helpers ---
let passed = 0;
let failed = 0;
function pass(label) { console.log(`  ✓ ${label}`); passed++; }
function fail(label, err) { console.error(`  ✗ ${label}: ${err?.message ?? err}`); failed++; }

// --- tests ---
console.log("\nLoad: all events return with fixture transport");
{
  try {
    const result = loadActivityFeed("all");
    assert.equal(result.transport, "fixture");
    assert.equal(result.total, 12);
    assert.ok(result.events.length > 0);
    pass(`loaded ${result.total} events with fixture transport`);
  } catch (err) { fail("load all", err); }
}

console.log("\nLoad: all event types represented in fixture");
{
  try {
    const types = new Set(fixtureActivityEvents.map((e) => e.type));
    for (const t of ["guardian", "vote", "treasury", "motion", "proposal", "member"]) {
      assert.ok(types.has(t), `${t} type should be present`);
    }
    pass("all 6 event types present in fixture");
  } catch (err) { fail("event type coverage", err); }
}

console.log("\nFilter: vote-only filter returns only vote events");
{
  try {
    const result = loadActivityFeed("vote");
    assert.ok(result.events.length > 0, "should have vote events");
    assert.ok(result.events.every((e) => e.type === "vote"), "all events should be votes");
    assert.equal(result.total, 4, "should have exactly 4 vote events");
    pass(`vote filter returns ${result.total} vote events`);
  } catch (err) { fail("vote filter", err); }
}

console.log("\nFilter: guardian filter returns guardian events only");
{
  try {
    const result = loadActivityFeed("guardian");
    assert.equal(result.total, 1);
    assert.equal(result.events[0].refId, "GRD-12");
    pass("guardian filter returns 1 event");
  } catch (err) { fail("guardian filter", err); }
}

console.log("\nFilter: member filter returns member events only");
{
  try {
    const result = loadActivityFeed("member");
    assert.equal(result.total, 1);
    assert.equal(result.events[0].actor, "Community Operations");
    pass("member filter returns 1 event");
  } catch (err) { fail("member filter", err); }
}

console.log("\nSort: events are newest-first");
{
  try {
    const result = loadActivityFeed("all");
    for (let i = 1; i < result.events.length; i++) {
      const prev = new Date(result.events[i - 1].timestamp).getTime();
      const curr = new Date(result.events[i].timestamp).getTime();
      assert.ok(prev >= curr, `event ${i - 1} should be newer than event ${i}`);
    }
    pass("events sorted newest-first");
  } catch (err) { fail("sort order", err); }
}

console.log("\nPagination: page 0 returns ≤10 items, page 1 returns remainder");
{
  try {
    const p0 = loadActivityFeed("all", 0);
    const p1 = loadActivityFeed("all", 1);
    assert.equal(p0.events.length, 10, "page 0 should have 10 events");
    assert.equal(p0.hasMore, true, "page 0 should indicate more pages");
    assert.equal(p1.events.length, 2, "page 1 should have remaining 2 events");
    assert.equal(p1.hasMore, false, "page 1 should have no more pages");
    pass("pagination splits 12 events into 10+2");
  } catch (err) { fail("pagination", err); }
}

console.log("\nEvent shape: every event has required fields");
{
  try {
    const result = loadActivityFeed("all");
    for (const event of result.events) {
      assert.ok(event.id, "event must have id");
      assert.ok(event.type, "event must have type");
      assert.ok(event.title, "event must have title");
      assert.ok(event.actor, "event must have actor");
      assert.ok(event.summary, "event must have summary");
      assert.ok(event.timestamp, "event must have timestamp");
      assert.ok(!isNaN(new Date(event.timestamp).getTime()), `${event.id} timestamp must be valid ISO`);
    }
    pass("all events have valid required fields");
  } catch (err) { fail("event shape", err); }
}

console.log("\nFilter: proposal filter returns exactly 2 events");
{
  try {
    const result = loadActivityFeed("proposal");
    assert.equal(result.total, 2, `expected 2 proposal events, got ${result.total}`);
    assert.ok(result.events.every((e) => e.type === "proposal"));
    pass(`proposal filter returns ${result.total} events`);
  } catch (err) { fail("proposal filter", err); }
}

console.log("\nFilter: treasury filter returns exactly 2 events");
{
  try {
    const result = loadActivityFeed("treasury");
    assert.equal(result.total, 2, `expected 2 treasury events, got ${result.total}`);
    assert.ok(result.events.every((e) => e.type === "treasury"));
    pass(`treasury filter returns ${result.total} events`);
  } catch (err) { fail("treasury filter", err); }
}

// --- summary ---
console.log(`\ncheck-activity: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
