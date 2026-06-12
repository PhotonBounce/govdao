/**
 * Headless QA for delegate motion decisions and block-explorer receipt links.
 * Exercises the decision phases, receipt shape, anchor-hash determinism,
 * anchoring flag propagation, and explorer URL construction rules.
 */

import assert from "node:assert/strict";

// --- inline submitMotionDecision (mirrors motionActionSource.ts) ---

function buildFixtureAnchorHash(seed) {
  let acc = 11;
  for (let index = 0; index < seed.length; index += 1) {
    acc = (acc * 31 + seed.charCodeAt(index)) >>> 0;
  }

  let hex = "";
  while (hex.length < 64) {
    acc = (acc * 1103515245 + 12345) >>> 0;
    hex += acc.toString(16).padStart(8, "0");
  }

  return `0x${hex.slice(0, 64)}`;
}

async function submitMotionDecision(motionId, decision, identity, anchoringEnabled, onPhase) {
  onPhase?.("reviewing");
  await new Promise((r) => setTimeout(r, 10));
  onPhase?.("recording");
  await new Promise((r) => setTimeout(r, 10));

  return {
    motionId,
    decision,
    reviewer: identity.address,
    reviewerLabel: identity.memberLabel,
    anchorHash: buildFixtureAnchorHash(`${motionId}:${decision}:${identity.address}`),
    anchored: anchoringEnabled,
    transport: "fixture",
    recordedAt: new Date().toISOString()
  };
}

function formatMotionDecision(decision) {
  return decision === "approve" ? "Approve" : "Return For Revision";
}

// --- inline explorer URL builders (mirrors explorerSource.ts) ---

const TX_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

function isPlaceholder(value) {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("example.") || normalized.includes("your_");
}

function getExplorerBase(manifest) {
  const base = manifest.chain.blockExplorer?.trim() ?? "";
  if (!base.startsWith("https://") || isPlaceholder(base)) {
    return null;
  }
  return base.replace(/\/$/, "");
}

function buildExplorerTxUrl(manifest, txHash) {
  const base = getExplorerBase(manifest);
  if (!base || !TX_HASH_PATTERN.test(txHash.trim())) {
    return null;
  }
  return `${base}/tx/${txHash.trim()}`;
}

function buildExplorerAddressUrl(manifest, address) {
  const base = getExplorerBase(manifest);
  if (!base || !ADDRESS_PATTERN.test(address.trim())) {
    return null;
  }
  return `${base}/address/${address.trim()}`;
}

const FIXTURE_IDENTITY = {
  methodId: "passkey",
  methodLabel: "Passkey",
  kind: "offchain",
  memberLabel: "Member Success Reviewer",
  address: "0x1234567890123456789012345678901234567890",
  role: "Reviewer",
  transport: "fixture",
  connectedAt: new Date().toISOString()
};

const SEPOLIA_MANIFEST = { chain: { blockExplorer: "https://sepolia.etherscan.io" } };
const PLACEHOLDER_MANIFEST = { chain: { blockExplorer: "https://example.govdao.app/explorer" } };
const VALID_TX = "0xa6bf7844d647eea9d3ecb510f58b23d4bf18fd999aca959d7c3fa907a3835020";

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

// --- motion decision tests ---
console.log("\nMotion decision: approve phases through reviewing→recording→receipt");
{
  const phases = [];
  try {
    const receipt = await submitMotionDecision("OPS-22", "approve", FIXTURE_IDENTITY, true, (p) => phases.push(p));
    assert.deepEqual(phases, ["reviewing", "recording"], "should phase through both states");
    assert.equal(receipt.motionId, "OPS-22");
    assert.equal(receipt.decision, "approve");
    assert.equal(receipt.reviewer, FIXTURE_IDENTITY.address);
    assert.equal(receipt.reviewerLabel, FIXTURE_IDENTITY.memberLabel);
    assert.equal(receipt.transport, "fixture");
    assert.ok(TX_HASH_PATTERN.test(receipt.anchorHash), "anchor hash should be 0x + 64 hex chars");
    pass(`approve receipt recorded with anchor ${receipt.anchorHash.slice(0, 14)}…`);
  } catch (err) {
    fail("approve decision flow", err);
  }
}

console.log("\nMotion decision: return decision recorded");
{
  try {
    const receipt = await submitMotionDecision("OPS-24", "return", FIXTURE_IDENTITY, true, () => {});
    assert.equal(receipt.decision, "return");
    pass("return decision recorded");
  } catch (err) {
    fail("return decision flow", err);
  }
}

console.log("\nMotion decision: anchored flag follows manifest anchoring setting");
{
  try {
    const anchoredReceipt = await submitMotionDecision("OPS-22", "approve", FIXTURE_IDENTITY, true, () => {});
    const unanchoredReceipt = await submitMotionDecision("OPS-22", "approve", FIXTURE_IDENTITY, false, () => {});
    assert.equal(anchoredReceipt.anchored, true, "anchoringEnabled=true should mark receipt anchored");
    assert.equal(unanchoredReceipt.anchored, false, "anchoringEnabled=false should mark receipt unanchored");
    pass("anchored flag follows voteAnchoringEnabled");
  } catch (err) {
    fail("anchored flag", err);
  }
}

console.log("\nMotion decision: anchor hash is deterministic per motion+decision+reviewer");
{
  try {
    const first = await submitMotionDecision("OPS-22", "approve", FIXTURE_IDENTITY, true, () => {});
    const second = await submitMotionDecision("OPS-22", "approve", FIXTURE_IDENTITY, true, () => {});
    const different = await submitMotionDecision("OPS-22", "return", FIXTURE_IDENTITY, true, () => {});
    assert.equal(first.anchorHash, second.anchorHash, "same inputs should produce same anchor");
    assert.notEqual(first.anchorHash, different.anchorHash, "different decision should change the anchor");
    pass("anchor hash deterministic and decision-sensitive");
  } catch (err) {
    fail("anchor determinism", err);
  }
}

console.log("\nMotion decision: labels");
{
  try {
    assert.equal(formatMotionDecision("approve"), "Approve");
    assert.equal(formatMotionDecision("return"), "Return For Revision");
    pass("decision labels format correctly");
  } catch (err) {
    fail("decision labels", err);
  }
}

// --- explorer URL tests ---
console.log("\nExplorer: valid tx hash builds /tx/ URL");
{
  try {
    const url = buildExplorerTxUrl(SEPOLIA_MANIFEST, VALID_TX);
    assert.equal(url, `https://sepolia.etherscan.io/tx/${VALID_TX}`);
    pass("tx URL built for configured explorer");
  } catch (err) {
    fail("tx URL", err);
  }
}

console.log("\nExplorer: trailing slash on base is normalized");
{
  try {
    const url = buildExplorerTxUrl({ chain: { blockExplorer: "https://sepolia.etherscan.io/" } }, VALID_TX);
    assert.equal(url, `https://sepolia.etherscan.io/tx/${VALID_TX}`, "trailing slash should not double up");
    pass("trailing slash normalized");
  } catch (err) {
    fail("trailing slash", err);
  }
}

console.log("\nExplorer: placeholder explorer yields null");
{
  try {
    assert.equal(buildExplorerTxUrl(PLACEHOLDER_MANIFEST, VALID_TX), null, "example. domain should be rejected");
    assert.equal(buildExplorerTxUrl({ chain: { blockExplorer: "https://YOUR_EXPLORER" } }, VALID_TX), null, "YOUR_ placeholder should be rejected");
    pass("placeholder explorers rejected");
  } catch (err) {
    fail("placeholder explorer", err);
  }
}

console.log("\nExplorer: non-https base yields null");
{
  try {
    assert.equal(buildExplorerTxUrl({ chain: { blockExplorer: "http://sepolia.etherscan.io" } }, VALID_TX), null);
    assert.equal(buildExplorerTxUrl({ chain: { blockExplorer: "" } }, VALID_TX), null);
    pass("non-https and empty bases rejected");
  } catch (err) {
    fail("non-https base", err);
  }
}

console.log("\nExplorer: malformed tx hash yields null");
{
  try {
    assert.equal(buildExplorerTxUrl(SEPOLIA_MANIFEST, "0xdeadbeef"), null, "short hash should be rejected");
    assert.equal(buildExplorerTxUrl(SEPOLIA_MANIFEST, "not-a-hash"), null, "non-hex should be rejected");
    pass("malformed tx hashes rejected");
  } catch (err) {
    fail("malformed tx hash", err);
  }
}

console.log("\nExplorer: address URL built and validated");
{
  try {
    const address = "0x1234567890123456789012345678901234567890";
    assert.equal(buildExplorerAddressUrl(SEPOLIA_MANIFEST, address), `https://sepolia.etherscan.io/address/${address}`);
    assert.equal(buildExplorerAddressUrl(SEPOLIA_MANIFEST, "0x123"), null, "short address should be rejected");
    pass("address URLs built and validated");
  } catch (err) {
    fail("address URL", err);
  }
}

// --- summary ---
console.log(`\ncheck-motion: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
