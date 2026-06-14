/**
 * Headless QA for proposal creation flow.
 * Exercises draft validation, fixture submission phases, error paths, and reset.
 */

import assert from "node:assert/strict";

// --- inline validateProposalDraft (mirrors proposalCreationSource.ts) ---
const DOC_URI_PATTERN = /^(https:\/\/|fixture:\/\/)/;
const DOC_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;

function validateProposalDraft(draft) {
  const errors = [];
  if (!draft.title.trim()) {
    errors.push("Title is required.");
  } else if (draft.title.trim().length < 8) {
    errors.push("Title must be at least 8 characters.");
  }
  if (!draft.summary.trim()) {
    errors.push("Summary is required.");
  } else if (draft.summary.trim().length < 20) {
    errors.push("Summary must be at least 20 characters.");
  }
  if (draft.docUri.trim() && !DOC_URI_PATTERN.test(draft.docUri.trim())) {
    errors.push("Document URI must start with https://.");
  }
  if (draft.docHash.trim() && !DOC_HASH_PATTERN.test(draft.docHash.trim())) {
    errors.push("Document hash must be a valid 0x-prefixed keccak-256 hex string (66 chars).");
  }
  return errors;
}

// --- inline submitProposalDraft (fixture path only) ---
function buildFixtureTxHash(address) {
  const addrPart = address.replace(/^0x/i, "").slice(0, 8).toLowerCase();
  const timePart = Date.now().toString(16).padStart(12, "0").slice(-12);
  return `0x${addrPart}${timePart}${"0".repeat(44)}`.slice(0, 66);
}

async function submitProposalDraft(draft, identity, onPhase) {
  onPhase("validating");
  const errors = validateProposalDraft(draft);
  if (errors.length > 0) {
    onPhase("error");
    throw new Error(errors[0]);
  }
  await new Promise((r) => setTimeout(r, 10));
  onPhase("submitting");
  await new Promise((r) => setTimeout(r, 10));
  const fixtureIndex = 300 + Math.floor(Math.random() * 600);
  onPhase("submitted");
  return {
    proposalId: `GOV-${fixtureIndex}`,
    txHash: buildFixtureTxHash(identity.address)
  };
}

const FIXTURE_IDENTITY = {
  methodId: "walletconnect",
  methodLabel: "WalletConnect",
  kind: "wallet",
  memberLabel: "Member 0x1234",
  address: "0x1234567890123456789012345678901234567890",
  role: "Member",
  transport: "fixture",
  connectedAt: new Date().toISOString()
};

let passed = 0;
let failed = 0;

function pass(label) {
  console.log(`  ✓ ${label}`);
  passed++;
}

function fail(label, err) {
  console.error(`  ✗ ${label}: ${err?.message ?? err}`);
  failed++;
}

// --- validation tests ---
console.log("\nValidation: empty draft");
{
  const errors = validateProposalDraft({ title: "", summary: "", docUri: "", docHash: "" });
  try {
    assert.equal(errors.length, 2, "empty draft should have 2 errors");
    assert.ok(errors.some((e) => e.includes("Title")), "should flag missing title");
    assert.ok(errors.some((e) => e.includes("Summary")), "should flag missing summary");
    pass("empty draft produces title+summary errors");
  } catch (err) {
    fail("empty draft validation", err);
  }
}

console.log("\nValidation: title too short");
{
  const errors = validateProposalDraft({ title: "Short", summary: "A summary long enough to satisfy the minimum requirements here.", docUri: "", docHash: "" });
  try {
    assert.ok(errors.some((e) => e.includes("8 characters")), "should flag short title");
    pass("short title flagged");
  } catch (err) {
    fail("short title validation", err);
  }
}

console.log("\nValidation: summary too short");
{
  const errors = validateProposalDraft({ title: "Valid title here", summary: "Too short", docUri: "", docHash: "" });
  try {
    assert.ok(errors.some((e) => e.includes("20 characters")), "should flag short summary");
    pass("short summary flagged");
  } catch (err) {
    fail("short summary validation", err);
  }
}

console.log("\nValidation: invalid doc URI");
{
  const errors = validateProposalDraft({ title: "Valid title here", summary: "A summary long enough to satisfy the minimum requirements here.", docUri: "ftp://example.com/doc", docHash: "" });
  try {
    assert.ok(errors.some((e) => e.includes("Document URI")), "should flag bad URI");
    pass("invalid doc URI flagged");
  } catch (err) {
    fail("doc URI validation", err);
  }
}

console.log("\nValidation: invalid doc hash");
{
  const errors = validateProposalDraft({ title: "Valid title here", summary: "A summary long enough to satisfy the minimum requirements here.", docUri: "", docHash: "0xdeadbeef" });
  try {
    assert.ok(errors.some((e) => e.includes("keccak")), "should flag bad hash");
    pass("invalid doc hash flagged");
  } catch (err) {
    fail("doc hash validation", err);
  }
}

console.log("\nValidation: valid full draft");
{
  const errors = validateProposalDraft({
    title: "Upgrade guardian threshold to 4-of-7",
    summary: "This proposal raises the emergency guardian signer requirement from 3-of-5 to 4-of-7 to reduce single-point-of-failure risk.",
    docUri: "https://docs.govdao.app/proposals/guardian-threshold",
    docHash: "0xa6bf7844d647eea9d3ecb510f58b23d4bf18fd999aca959d7c3fa907a3835020"
  });
  try {
    assert.equal(errors.length, 0, "valid draft should have no errors");
    pass("valid full draft passes validation");
  } catch (err) {
    fail("valid full draft", err);
  }
}

console.log("\nValidation: fixture:// doc URI accepted");
{
  const errors = validateProposalDraft({
    title: "Valid title here",
    summary: "A summary long enough to satisfy the minimum requirements here.",
    docUri: "fixture://govdao/docs/proposal-draft",
    docHash: ""
  });
  try {
    assert.equal(errors.length, 0, "fixture:// URI should pass");
    pass("fixture:// URI accepted");
  } catch (err) {
    fail("fixture:// URI", err);
  }
}

// --- submission tests ---
console.log("\nSubmission: valid draft phases through validating→submitting→submitted");
{
  const phases = [];
  const draft = {
    title: "Upgrade guardian threshold to 4-of-7",
    summary: "This proposal raises the emergency guardian signer requirement from 3-of-5 to 4-of-7 to reduce single-point-of-failure risk.",
    docUri: "",
    docHash: ""
  };
  try {
    const result = await submitProposalDraft(draft, FIXTURE_IDENTITY, (p) => phases.push(p));
    assert.deepEqual(phases, ["validating", "submitting", "submitted"], "should phase through all 3 states");
    assert.ok(result.proposalId.startsWith("GOV-"), "proposalId should start with GOV-");
    assert.ok(result.txHash.startsWith("0x"), "txHash should start with 0x");
    assert.equal(result.txHash.length, 66, "txHash should be 66 chars");
    pass(`fixture submission succeeded: ${result.proposalId}, txHash ${result.txHash.slice(0, 14)}…`);
  } catch (err) {
    fail("valid draft submission", err);
  }
}

console.log("\nSubmission: invalid draft throws and phases to error");
{
  const phases = [];
  const draft = { title: "", summary: "", docUri: "", docHash: "" };
  try {
    await submitProposalDraft(draft, FIXTURE_IDENTITY, (p) => phases.push(p));
    fail("invalid draft should throw", new Error("did not throw"));
  } catch (_err) {
    try {
      assert.ok(phases.includes("error"), "should reach error phase");
      pass("invalid draft throws and phases to error");
    } catch (assertErr) {
      fail("invalid draft error phase", assertErr);
    }
  }
}

console.log("\nSubmission: tx hash includes address prefix");
{
  const phases = [];
  const draft = {
    title: "Valid governance proposal here",
    summary: "This summary is long enough to satisfy the minimum character requirement for proposals.",
    docUri: "",
    docHash: ""
  };
  const identity = { ...FIXTURE_IDENTITY, address: "0xABCDEF1234567890abcdef1234567890ABCDEF12" };
  try {
    const result = await submitProposalDraft(draft, identity, (p) => phases.push(p));
    const prefix = identity.address.replace(/^0x/i, "").slice(0, 8).toLowerCase();
    assert.ok(result.txHash.includes(prefix), "tx hash should embed the signer address prefix");
    pass("tx hash embeds address prefix");
  } catch (err) {
    fail("tx hash address prefix", err);
  }
}

// --- summary ---
console.log(`\ncheck-create-proposal: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
