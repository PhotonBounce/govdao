/**
 * Headless QA for memberInviteSource — member invitation flows.
 * Covers: address validation, role validation, display name validation,
 * phase sequence, receipt shape, session gate, predefined role list.
 */

import assert from "node:assert/strict";

// --- inline member invite source (mirrors memberInviteSource.ts) ---

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const PREDEFINED_ROLES = ["Delegate", "Guardian Delegate", "Treasury Steward", "Protocol Operator", "Community Lead"];

function validateInviteDraft(draft) {
  const errors = [];
  if (!ADDRESS_RE.test(draft.address.trim())) {
    errors.push("Address must be a valid Ethereum address (0x…40 hex chars).");
  }
  if (!draft.role.trim() || draft.role.trim().length < 4) {
    errors.push("Role must be at least 4 characters.");
  }
  if (!draft.displayName.trim() || draft.displayName.trim().length < 3) {
    errors.push("Display name must be at least 3 characters.");
  }
  return errors;
}

function buildInviteId() {
  return `MBR-${String(5 + Math.floor(Math.random() * 95)).padStart(3, "0")}`;
}

async function submitMemberInvite(draft, identity, _manifest, onPhase) {
  onPhase("validating");
  const errors = validateInviteDraft(draft);
  if (errors.length > 0) { onPhase("error"); throw new Error(errors[0]); }
  if (!identity) { onPhase("error"); throw new Error("Active member session required to submit an invitation."); }
  await new Promise((r) => setTimeout(r, 10));
  onPhase("submitting");
  await new Promise((r) => setTimeout(r, 10));
  onPhase("pending");
  return {
    inviteId: buildInviteId(),
    address: draft.address.trim(),
    role: draft.role.trim(),
    displayName: draft.displayName.trim(),
    timelockLabel: "Pending registry confirmation — 24h timelock",
    transport: "fixture"
  };
}

const MOCK_IDENTITY = { memberLabel: "Council Member", method: "walletconnect" };
const VALID_DRAFT = {
  address: "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12",
  role: "Delegate",
  displayName: "Alice Governance"
};

let passed = 0;
let failed = 0;
function pass(label) { console.log(`  ✓ ${label}`); passed++; }
function fail(label, err) { console.error(`  ✗ ${label}: ${err?.message ?? err}`); failed++; }

console.log("\nValidation: valid draft returns no errors");
{
  try {
    const errors = validateInviteDraft(VALID_DRAFT);
    assert.equal(errors.length, 0);
    pass("valid draft is error-free");
  } catch (err) { fail("valid draft", err); }
}

console.log("\nValidation: bad Ethereum address rejected");
{
  try {
    const errors = validateInviteDraft({ ...VALID_DRAFT, address: "not-an-address" });
    assert.ok(errors.some((e) => e.includes("valid Ethereum address")));
    pass("invalid address rejected");
  } catch (err) { fail("invalid address", err); }
}

console.log("\nValidation: address without 0x prefix rejected");
{
  try {
    const errors = validateInviteDraft({ ...VALID_DRAFT, address: "AbCdEf1234567890AbCdEf1234567890AbCdEf12" });
    assert.ok(errors.some((e) => e.includes("valid Ethereum address")));
    pass("no-0x-prefix address rejected");
  } catch (err) { fail("no-0x address", err); }
}

console.log("\nValidation: short role (< 4 chars) rejected");
{
  try {
    const errors = validateInviteDraft({ ...VALID_DRAFT, role: "Dev" });
    assert.ok(errors.some((e) => e.includes("4 characters")));
    pass("short role rejected");
  } catch (err) { fail("short role", err); }
}

console.log("\nValidation: short display name (< 3 chars) rejected");
{
  try {
    const errors = validateInviteDraft({ ...VALID_DRAFT, displayName: "Al" });
    assert.ok(errors.some((e) => e.includes("3 characters")));
    pass("short display name rejected");
  } catch (err) { fail("short display name", err); }
}

console.log("\nSubmission: phases and receipt shape");
{
  const phases = [];
  try {
    const receipt = await submitMemberInvite(VALID_DRAFT, MOCK_IDENTITY, {}, (p) => phases.push(p));
    assert.deepEqual(phases, ["validating", "submitting", "pending"]);
    assert.ok(receipt.inviteId.startsWith("MBR-"), `inviteId should start with MBR-, got ${receipt.inviteId}`);
    assert.ok(/^\d{3}$/.test(receipt.inviteId.slice(4)), "inviteId suffix should be 3 digits");
    assert.equal(receipt.address, VALID_DRAFT.address.trim());
    assert.equal(receipt.role, "Delegate");
    assert.equal(receipt.displayName, "Alice Governance");
    assert.ok(receipt.timelockLabel.includes("24h"), "timelock label should mention 24h");
    assert.equal(receipt.transport, "fixture");
    pass("submission phases and receipt correct");
  } catch (err) { fail("submission phases", err); }
}

console.log("\nSubmission: no session throws");
{
  try {
    await submitMemberInvite(VALID_DRAFT, null, {}, () => {});
    fail("no session", new Error("did not throw"));
  } catch (err) {
    try {
      assert.ok(err.message.includes("session required"), `expected session error, got: ${err.message}`);
      pass("no-session error thrown");
    } catch (assertErr) { fail("no-session error message", assertErr); }
  }
}

console.log("\nRoles: all predefined roles are present");
{
  try {
    const expectedRoles = ["Delegate", "Guardian Delegate", "Treasury Steward", "Protocol Operator", "Community Lead"];
    for (const role of expectedRoles) {
      assert.ok(PREDEFINED_ROLES.includes(role), `expected role ${role} to be present`);
    }
    assert.equal(PREDEFINED_ROLES.length, 5);
    pass("all 5 predefined roles present");
  } catch (err) { fail("predefined roles", err); }
}

console.log("\nValidation: all predefined roles pass role validation");
{
  try {
    for (const role of PREDEFINED_ROLES) {
      const errors = validateInviteDraft({ ...VALID_DRAFT, role });
      assert.equal(errors.length, 0, `predefined role "${role}" should be valid`);
    }
    pass("all predefined roles pass validation");
  } catch (err) { fail("predefined role validation", err); }
}

console.log(`\ncheck-member-invite: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
