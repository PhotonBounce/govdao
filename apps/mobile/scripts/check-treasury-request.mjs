/**
 * Headless QA for treasuryRequestSource — spend request validation and submission.
 * Covers: field validation (title, amount, address, purpose, docUri),
 * per-transfer cap enforcement, session gate, fixture submission phases,
 * and receipt shape.
 */

import assert from "node:assert/strict";

// --- inline treasury request source (mirrors treasuryRequestSource.ts) ---

const ETH_AMOUNT_RE = /^\d+(\.\d{1,18})?$/;
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const DOC_URI_RE = /^(https?:\/\/|fixture:\/\/|ipfs:\/\/)/;

function validateSpendRequest(draft) {
  const errors = [];
  if (!draft.title?.trim() || draft.title.trim().length < 6) {
    errors.push("Title must be at least 6 characters.");
  }
  if (!draft.amount?.trim() || !ETH_AMOUNT_RE.test(draft.amount.trim())) {
    errors.push("Amount must be a valid ETH number (e.g. 1.5 or 10).");
  } else {
    const parsed = parseFloat(draft.amount);
    if (parsed <= 0) errors.push("Amount must be greater than zero.");
    if (parsed > 25) errors.push("Amount exceeds the per-transfer cap of 25 ETH.");
  }
  if (!draft.recipientAddress?.trim() || !ADDRESS_RE.test(draft.recipientAddress.trim())) {
    errors.push("Recipient must be a valid Ethereum address (0x…40 hex chars).");
  }
  if (!draft.purpose?.trim() || draft.purpose.trim().length < 20) {
    errors.push("Purpose must be at least 20 characters.");
  }
  if (draft.docUri && !DOC_URI_RE.test(draft.docUri.trim())) {
    errors.push("Doc URI must start with https://, fixture://, or ipfs://.");
  }
  return errors;
}

function buildRequestId() {
  return `TRX-${100 + Math.floor(Math.random() * 900)}`;
}

function buildFixtureTxHash(requestId) {
  const idPart = requestId.replace(/[^0-9]/g, "").padStart(6, "0");
  const timePart = Date.now().toString(16).slice(-12).padStart(12, "0");
  return `0x${idPart}${timePart}${"0".repeat(46)}`;
}

async function submitSpendRequest(draft, identity, onPhase) {
  onPhase("validating");
  const errors = validateSpendRequest(draft);
  if (errors.length > 0) { onPhase("error"); throw new Error(errors[0]); }
  if (!identity) { onPhase("error"); throw new Error("Session required to submit treasury spend requests."); }
  await new Promise((r) => setTimeout(r, 10));
  onPhase("submitting");
  await new Promise((r) => setTimeout(r, 10));
  onPhase("queued");
  const requestId = buildRequestId();
  return { requestId, txHash: buildFixtureTxHash(requestId), timelockEtaLabel: "Timelock: 24h", timelockSeconds: 86400, transport: "fixture" };
}

const VALID_DRAFT = {
  title: "Security tooling grant",
  amount: "5.0",
  recipientAddress: "0xA1b2C3d4E5f6a7B8C9d0E1f2A3B4C5D6E7F8a9B0",
  purpose: "Fund security tooling maintenance for the guardian signer set.",
  docUri: "fixture://govdao/docs/sec-grant"
};

const MOCK_IDENTITY = { memberLabel: "Delegate Desk", method: "walletconnect" };

let passed = 0;
let failed = 0;
function pass(label) { console.log(`  ✓ ${label}`); passed++; }
function fail(label, err) { console.error(`  ✗ ${label}: ${err?.message ?? err}`); failed++; }

// --- validation tests ---
console.log("\nValidation: empty draft rejected");
{
  try {
    const errs = validateSpendRequest({});
    assert.ok(errs.length >= 4, `expected ≥4 errors, got ${errs.length}`);
    pass("empty draft produces multiple errors");
  } catch (err) { fail("empty draft", err); }
}

console.log("\nValidation: title too short");
{
  try {
    const errs = validateSpendRequest({ ...VALID_DRAFT, title: "Hi" });
    assert.ok(errs.some((e) => e.includes("Title")), "title error missing");
    pass("short title flagged");
  } catch (err) { fail("title validation", err); }
}

console.log("\nValidation: invalid amount");
{
  try {
    assert.ok(validateSpendRequest({ ...VALID_DRAFT, amount: "abc" }).some((e) => e.includes("Amount")));
    assert.ok(validateSpendRequest({ ...VALID_DRAFT, amount: "0" }).some((e) => e.includes("greater than zero")));
    pass("invalid and zero amounts flagged");
  } catch (err) { fail("amount validation", err); }
}

console.log("\nValidation: per-transfer cap enforced at 25 ETH");
{
  try {
    const errs = validateSpendRequest({ ...VALID_DRAFT, amount: "26" });
    assert.ok(errs.some((e) => e.includes("per-transfer cap")), "cap error missing");
    pass("26 ETH amount rejected (cap 25)");
  } catch (err) { fail("cap enforcement", err); }
}

console.log("\nValidation: exactly 25 ETH passes");
{
  try {
    const errs = validateSpendRequest({ ...VALID_DRAFT, amount: "25" });
    assert.equal(errs.length, 0, "25 ETH should pass");
    pass("exactly 25 ETH accepted");
  } catch (err) { fail("cap boundary", err); }
}

console.log("\nValidation: invalid recipient address rejected");
{
  try {
    const errs = validateSpendRequest({ ...VALID_DRAFT, recipientAddress: "0xinvalid" });
    assert.ok(errs.some((e) => e.includes("Ethereum address")), "address error missing");
    pass("invalid address rejected");
  } catch (err) { fail("address validation", err); }
}

console.log("\nValidation: purpose too short");
{
  try {
    const errs = validateSpendRequest({ ...VALID_DRAFT, purpose: "Too short." });
    assert.ok(errs.some((e) => e.includes("Purpose")), "purpose error missing");
    pass("short purpose flagged");
  } catch (err) { fail("purpose validation", err); }
}

console.log("\nValidation: invalid doc URI rejected");
{
  try {
    const errs = validateSpendRequest({ ...VALID_DRAFT, docUri: "ftp://invalid" });
    assert.ok(errs.some((e) => e.includes("Doc URI")), "docUri error missing");
    pass("invalid doc URI rejected");
  } catch (err) { fail("docUri validation", err); }
}

console.log("\nValidation: valid draft passes");
{
  try {
    const errs = validateSpendRequest(VALID_DRAFT);
    assert.equal(errs.length, 0, `expected 0 errors, got: ${errs.join(", ")}`);
    pass("valid draft passes all checks");
  } catch (err) { fail("valid draft", err); }
}

// --- submission tests ---
console.log("\nSubmission: phases through validating→submitting→queued");
{
  const phases = [];
  try {
    const result = await submitSpendRequest(VALID_DRAFT, MOCK_IDENTITY, (p) => phases.push(p));
    assert.deepEqual(phases, ["validating", "submitting", "queued"]);
    assert.equal(result.transport, "fixture");
    assert.ok(result.requestId.startsWith("TRX-"), "requestId format wrong");
    assert.ok(result.txHash.startsWith("0x"), "txHash format wrong");
    assert.equal(result.txHash.length, 66, `txHash length ${result.txHash.length} ≠ 66`);
    pass(`submission succeeded: ${result.requestId}`);
  } catch (err) { fail("submission phases", err); }
}

console.log("\nSubmission: no session → error phase");
{
  try {
    await submitSpendRequest(VALID_DRAFT, null, () => {});
    fail("no session", new Error("did not throw"));
  } catch (err) {
    try {
      assert.ok(err.message.includes("Session required"), `error should mention session, got: ${err.message}`);
      pass("no-session error thrown");
    } catch (assertErr) { fail("no-session error", assertErr); }
  }
}

console.log("\nSubmission: invalid draft throws at validating phase");
{
  const phases = [];
  try {
    await submitSpendRequest({ title: "X", amount: "abc", recipientAddress: "bad", purpose: "too short" }, MOCK_IDENTITY, (p) => phases.push(p));
    fail("invalid draft", new Error("did not throw"));
  } catch (err) {
    try {
      assert.ok(phases.includes("validating"), "should phase through validating");
      assert.ok(phases.includes("error"), "should phase to error");
      pass("invalid draft throws at validation");
    } catch (assertErr) { fail("invalid draft phases", assertErr); }
  }
}

console.log(`\ncheck-treasury-request: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
