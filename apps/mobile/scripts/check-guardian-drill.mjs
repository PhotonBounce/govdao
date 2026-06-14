/**
 * Headless QA for guardianDrillSource — guardian drill scheduling flows.
 * Covers: validation, drill types, window constraints, phase sequence,
 * receipt shape, session gate, label formatting.
 */

import assert from "node:assert/strict";

// --- inline guardian drill source (mirrors guardianDrillSource.ts) ---

const DRILL_TYPE_LABELS = {
  "pause": "Pause Drill",
  "resume": "Resume Drill",
  "full-cycle": "Full Pause/Resume Cycle"
};

function formatDrillType(drillType) { return DRILL_TYPE_LABELS[drillType]; }

function validateDrillDraft(draft) {
  const errors = [];
  if (!draft.drillType) errors.push("Drill type is required.");
  if (!draft.scheduledWindowHours || draft.scheduledWindowHours < 1 || draft.scheduledWindowHours > 72) {
    errors.push("Window must be between 1 and 72 hours.");
  }
  if (!draft.notesForSigners.trim() || draft.notesForSigners.trim().length < 10) {
    errors.push("Notes for signers must be at least 10 characters.");
  }
  return errors;
}

function buildDrillId() { return `GRD-${20 + Math.floor(Math.random() * 80)}`; }

async function scheduleDrill(draft, identity, _manifest, onPhase) {
  onPhase("validating");
  const errors = validateDrillDraft(draft);
  if (errors.length > 0) { onPhase("error"); throw new Error(errors[0]); }
  if (!identity) { onPhase("error"); throw new Error("Active member session required to schedule a guardian drill."); }
  await new Promise((r) => setTimeout(r, 10));
  onPhase("scheduling");
  await new Promise((r) => setTimeout(r, 10));
  onPhase("scheduled");
  return {
    drillId: buildDrillId(),
    drillType: draft.drillType,
    scheduledAt: new Date().toISOString(),
    windowLabel: `${draft.scheduledWindowHours}h window`,
    requiredSigners: 3,
    transport: "fixture"
  };
}

const MOCK_IDENTITY = { memberLabel: "Guardian Op", method: "walletconnect" };
const VALID_DRAFT = { drillType: "pause", scheduledWindowHours: 4, notesForSigners: "Monthly drill to verify pause pathway is operational." };

let passed = 0;
let failed = 0;
function pass(label) { console.log(`  ✓ ${label}`); passed++; }
function fail(label, err) { console.error(`  ✗ ${label}: ${err?.message ?? err}`); failed++; }

console.log("\nValidation: valid draft returns no errors");
{
  try {
    const errors = validateDrillDraft(VALID_DRAFT);
    assert.equal(errors.length, 0);
    pass("valid draft is error-free");
  } catch (err) { fail("valid draft", err); }
}

console.log("\nValidation: missing notes fails (< 10 chars)");
{
  try {
    const errors = validateDrillDraft({ ...VALID_DRAFT, notesForSigners: "short" });
    assert.ok(errors.some((e) => e.includes("10 characters")), "should flag notes length");
    pass("short notes rejected");
  } catch (err) { fail("short notes", err); }
}

console.log("\nValidation: window = 0 fails");
{
  try {
    const errors = validateDrillDraft({ ...VALID_DRAFT, scheduledWindowHours: 0 });
    assert.ok(errors.some((e) => e.includes("between 1 and 72")));
    pass("window 0 rejected");
  } catch (err) { fail("window 0", err); }
}

console.log("\nValidation: window = 73 fails");
{
  try {
    const errors = validateDrillDraft({ ...VALID_DRAFT, scheduledWindowHours: 73 });
    assert.ok(errors.some((e) => e.includes("between 1 and 72")));
    pass("window 73 rejected");
  } catch (err) { fail("window 73", err); }
}

console.log("\nValidation: window 1 and 72 are both valid");
{
  try {
    assert.equal(validateDrillDraft({ ...VALID_DRAFT, scheduledWindowHours: 1 }).length, 0);
    assert.equal(validateDrillDraft({ ...VALID_DRAFT, scheduledWindowHours: 72 }).length, 0);
    pass("boundary windows 1 and 72 accepted");
  } catch (err) { fail("boundary windows", err); }
}

console.log("\nScheduling: phases and receipt shape");
{
  const phases = [];
  try {
    const receipt = await scheduleDrill(VALID_DRAFT, MOCK_IDENTITY, {}, (p) => phases.push(p));
    assert.deepEqual(phases, ["validating", "scheduling", "scheduled"]);
    assert.ok(receipt.drillId.startsWith("GRD-"), `drillId should start with GRD-, got ${receipt.drillId}`);
    assert.equal(receipt.drillType, "pause");
    assert.equal(receipt.windowLabel, "4h window");
    assert.equal(receipt.requiredSigners, 3);
    assert.equal(receipt.transport, "fixture");
    assert.ok(receipt.scheduledAt.length > 10, "scheduledAt should be an ISO timestamp");
    pass("scheduling phases and receipt correct");
  } catch (err) { fail("scheduling phases", err); }
}

console.log("\nScheduling: no session throws");
{
  try {
    await scheduleDrill(VALID_DRAFT, null, {}, () => {});
    fail("no session", new Error("did not throw"));
  } catch (err) {
    try {
      assert.ok(err.message.includes("session required"), `expected session error, got: ${err.message}`);
      pass("no-session error thrown");
    } catch (assertErr) { fail("no-session error message", assertErr); }
  }
}

console.log("\nLabels: all drill types have display labels");
{
  try {
    const types = ["pause", "resume", "full-cycle"];
    for (const type of types) {
      const label = formatDrillType(type);
      assert.ok(label && label.length > 0, `${type} missing label`);
    }
    pass("all drill types have display labels");
  } catch (err) { fail("drill type labels", err); }
}

console.log("\nScheduling: full-cycle type receipt");
{
  try {
    const receipt = await scheduleDrill(
      { ...VALID_DRAFT, drillType: "full-cycle" },
      MOCK_IDENTITY,
      {},
      () => {}
    );
    assert.equal(receipt.drillType, "full-cycle");
    pass("full-cycle drill receipt correct");
  } catch (err) { fail("full-cycle drill", err); }
}

console.log(`\ncheck-guardian-drill: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
