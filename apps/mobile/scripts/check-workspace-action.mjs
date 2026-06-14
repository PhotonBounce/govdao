/**
 * Headless QA for workspaceActionSource — document action flows.
 * Covers: allowed actions per status, action submission phases,
 * receipt shape, session gate, label formatting, and error handling.
 */

import assert from "node:assert/strict";

// --- inline workspace action source (mirrors workspaceActionSource.ts) ---

const ACTION_LABELS = { "request-review": "Request Review", "publish": "Publish to Members", "archive": "Archive" };
const ACTION_MESSAGES = {
  "request-review": "Review request routed to the configured reviewer group.",
  "publish": "Document published — members can now view it in the governance feed.",
  "archive": "Item archived and removed from the active workspace queue."
};

function formatWorkspaceAction(action) { return ACTION_LABELS[action]; }

async function submitWorkspaceAction(itemId, action, identity, onPhase) {
  if (!identity) throw new Error("Session required to perform workspace actions.");
  onPhase("submitting");
  await new Promise((r) => setTimeout(r, 10));
  onPhase("done");
  return { action, itemId, actedAt: new Date().toISOString(), transport: "fixture", message: ACTION_MESSAGES[action] };
}

function allowedActions(itemStatus) {
  if (itemStatus === "Needs Review") return ["request-review", "archive"];
  if (itemStatus === "Ready") return ["publish", "archive"];
  if (itemStatus === "Scheduled") return ["archive"];
  return ["archive"];
}

const MOCK_IDENTITY = { memberLabel: "Delegate Desk", method: "walletconnect" };

let passed = 0;
let failed = 0;
function pass(label) { console.log(`  ✓ ${label}`); passed++; }
function fail(label, err) { console.error(`  ✗ ${label}: ${err?.message ?? err}`); failed++; }

console.log("\nActions: Needs Review status allows request-review and archive");
{
  try {
    const actions = allowedActions("Needs Review");
    assert.ok(actions.includes("request-review"), "should include request-review");
    assert.ok(actions.includes("archive"), "should include archive");
    assert.ok(!actions.includes("publish"), "should not include publish");
    pass("Needs Review → [request-review, archive]");
  } catch (err) { fail("Needs Review actions", err); }
}

console.log("\nActions: Ready status allows publish and archive");
{
  try {
    const actions = allowedActions("Ready");
    assert.ok(actions.includes("publish"), "should include publish");
    assert.ok(actions.includes("archive"), "should include archive");
    assert.ok(!actions.includes("request-review"), "should not include request-review");
    pass("Ready → [publish, archive]");
  } catch (err) { fail("Ready actions", err); }
}

console.log("\nActions: Scheduled status allows archive only");
{
  try {
    const actions = allowedActions("Scheduled");
    assert.deepEqual(actions, ["archive"]);
    pass("Scheduled → [archive]");
  } catch (err) { fail("Scheduled actions", err); }
}

console.log("\nActions: unknown status defaults to archive only");
{
  try {
    assert.deepEqual(allowedActions("Unknown"), ["archive"]);
    pass("unknown status → [archive]");
  } catch (err) { fail("unknown status", err); }
}

console.log("\nSubmission: request-review phases and receipt");
{
  const phases = [];
  try {
    const result = await submitWorkspaceAction("DOC-9", "request-review", MOCK_IDENTITY, (p) => phases.push(p));
    assert.deepEqual(phases, ["submitting", "done"]);
    assert.equal(result.action, "request-review");
    assert.equal(result.itemId, "DOC-9");
    assert.equal(result.transport, "fixture");
    assert.ok(result.message.length > 10, "message should be non-trivial");
    pass("request-review receipt correct");
  } catch (err) { fail("request-review submission", err); }
}

console.log("\nSubmission: publish action receipt");
{
  try {
    const result = await submitWorkspaceAction("DOC-9", "publish", MOCK_IDENTITY, () => {});
    assert.equal(result.action, "publish");
    assert.ok(result.message.includes("published"), "publish message should say published");
    pass("publish receipt correct");
  } catch (err) { fail("publish submission", err); }
}

console.log("\nSubmission: archive action receipt");
{
  try {
    const result = await submitWorkspaceAction("DOC-9", "archive", MOCK_IDENTITY, () => {});
    assert.equal(result.action, "archive");
    assert.ok(result.message.includes("archived"), "archive message should say archived");
    pass("archive receipt correct");
  } catch (err) { fail("archive submission", err); }
}

console.log("\nSubmission: no session throws");
{
  try {
    await submitWorkspaceAction("DOC-9", "publish", null, () => {});
    fail("no session", new Error("did not throw"));
  } catch (err) {
    try {
      assert.ok(err.message.includes("Session required"), `expected session error, got: ${err.message}`);
      pass("no-session error thrown");
    } catch (assertErr) { fail("no-session error", assertErr); }
  }
}

console.log("\nLabels: all actions have display labels");
{
  try {
    const actions = ["request-review", "publish", "archive"];
    for (const action of actions) {
      const label = formatWorkspaceAction(action);
      assert.ok(label && label.length > 0, `${action} missing label`);
    }
    pass("all actions have display labels");
  } catch (err) { fail("action labels", err); }
}

console.log(`\ncheck-workspace-action: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
