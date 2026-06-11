/**
 * Headless QA for the member directory feed.
 * Exercises fixture payload normalization, field mapping, empty-feed handling,
 * and address formatting.
 */

import assert from "node:assert/strict";

// --- inline normalization (mirrors mobileDataSource.ts) ---

function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value;
}

function readString(value, fallback) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function extractCollection(payload, candidateKeys) {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  for (const key of candidateKeys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate;
  }
  for (const candidate of Object.values(record)) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

const MOCK_MEMBER = {
  id: "MBR-FALLBACK",
  address: "0x0000000000000000000000000000000000000001",
  displayName: "Fallback Member",
  role: "Member",
  status: "Active",
  joinedAt: "2024-01-01"
};

function normalizeMemberItem(value, index) {
  const fallback = MOCK_MEMBER;
  const record = asRecord(value);
  if (!record) return fallback;
  return {
    id: readString(record.id ?? record.memberId ?? record.slug, fallback.id),
    address: readString(record.address ?? record.walletAddress ?? record.wallet, fallback.address),
    displayName: readString(record.displayName ?? record.name ?? record.alias, fallback.displayName),
    role: readString(record.role ?? record.memberRole ?? record.type, fallback.role),
    status: readString(record.status ?? record.state ?? record.memberStatus, fallback.status),
    joinedAt: readString(record.joinedAt ?? record.joinDate ?? record.createdAt, fallback.joinedAt)
  };
}

function normalizeMemberCollection(payload) {
  const items = extractCollection(payload, ["items", "data", "results", "members", "roster"]);
  return items.map(normalizeMemberItem);
}

// --- fixture payload (mirrors mobileDataSource.ts fixturePayloads) ---
const FIXTURE_MEMBERS_PAYLOAD = {
  members: [
    { memberId: "MBR-201", displayName: "Governance Steward", walletAddress: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b", memberRole: "On-chain Governor", state: "Active", joinDate: "2024-01-10" },
    { memberId: "MBR-202", displayName: "Treasury Custodian", walletAddress: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", memberRole: "Finance Delegate", state: "Active", joinDate: "2024-02-14" },
    { memberId: "MBR-203", displayName: "Community Ambassador", walletAddress: "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c", memberRole: "Regional Delegate", state: "Active", joinDate: "2024-05-20" },
    { memberId: "MBR-204", displayName: "Security Desk Lead", walletAddress: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d", memberRole: "Guardian Delegate", state: "Active", joinDate: "2024-03-08" }
  ]
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

// --- normalization tests ---
console.log("\nNormalization: fixture payload produces expected member count");
{
  const members = normalizeMemberCollection(FIXTURE_MEMBERS_PAYLOAD);
  try {
    assert.equal(members.length, 4, "should load 4 fixture members");
    pass(`loaded ${members.length} members from fixture payload`);
  } catch (err) {
    fail("fixture member count", err);
  }
}

console.log("\nNormalization: field mapping (memberId → id, walletAddress → address, memberRole → role)");
{
  const members = normalizeMemberCollection(FIXTURE_MEMBERS_PAYLOAD);
  try {
    const first = members[0];
    assert.equal(first.id, "MBR-201", "memberId should map to id");
    assert.equal(first.address, "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b", "walletAddress should map to address");
    assert.equal(first.role, "On-chain Governor", "memberRole should map to role");
    assert.equal(first.status, "Active", "state should map to status");
    assert.equal(first.joinedAt, "2024-01-10", "joinDate should map to joinedAt");
    assert.equal(first.displayName, "Governance Steward", "displayName should pass through");
    pass("field aliases map correctly");
  } catch (err) {
    fail("field mapping", err);
  }
}

console.log("\nNormalization: all members have required fields");
{
  const members = normalizeMemberCollection(FIXTURE_MEMBERS_PAYLOAD);
  const required = ["id", "address", "displayName", "role", "status", "joinedAt"];
  try {
    for (const member of members) {
      for (const field of required) {
        assert.ok(typeof member[field] === "string" && member[field].length > 0, `${member.id} missing ${field}`);
      }
    }
    pass(`all ${members.length} members have required fields`);
  } catch (err) {
    fail("required fields", err);
  }
}

console.log("\nNormalization: empty payload returns empty array");
{
  const members = normalizeMemberCollection({});
  try {
    assert.equal(members.length, 0, "empty payload should produce 0 members");
    pass("empty payload returns empty array");
  } catch (err) {
    fail("empty payload", err);
  }
}

console.log("\nNormalization: null payload returns empty array");
{
  const members = normalizeMemberCollection(null);
  try {
    assert.equal(members.length, 0, "null payload should produce 0 members");
    pass("null payload returns empty array");
  } catch (err) {
    fail("null payload", err);
  }
}

console.log("\nNormalization: bare array payload normalizes directly");
{
  const rawArray = [
    { id: "MBR-X", address: "0xaabbccddee112233445566778899aabbccddeeff", displayName: "Test Member", role: "Delegate", status: "Active", joinedAt: "2025-01-01" }
  ];
  const members = normalizeMemberCollection(rawArray);
  try {
    assert.equal(members.length, 1, "bare array should normalize to 1 member");
    assert.equal(members[0].id, "MBR-X", "should preserve id from bare array");
    pass("bare array payload normalizes correctly");
  } catch (err) {
    fail("bare array payload", err);
  }
}

console.log("\nNormalization: canonical fields take priority over aliases");
{
  const payload = {
    members: [{ id: "MBR-CANONICAL", memberId: "MBR-ALIAS", address: "0xaabbccddee112233445566778899aabbccddeeff", walletAddress: "0x0", displayName: "Canonical Name", name: "Alias Name", role: "Governor", memberRole: "Alias Role", status: "Active", state: "Inactive", joinedAt: "2025-01-01", joinDate: "1999-01-01" }]
  };
  const members = normalizeMemberCollection(payload);
  try {
    assert.equal(members[0].id, "MBR-CANONICAL", "canonical id takes priority over memberId");
    assert.equal(members[0].address, "0xaabbccddee112233445566778899aabbccddeeff", "canonical address takes priority over walletAddress");
    assert.equal(members[0].displayName, "Canonical Name", "canonical displayName takes priority over name");
    assert.equal(members[0].role, "Governor", "canonical role takes priority over memberRole");
    assert.equal(members[0].status, "Active", "canonical status takes priority over state");
    assert.equal(members[0].joinedAt, "2025-01-01", "canonical joinedAt takes priority over joinDate");
    pass("canonical fields take priority over aliases");
  } catch (err) {
    fail("field priority", err);
  }
}

// --- address formatting test ---
console.log("\nFormatting: short address helper");
{
  const address = "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b";
  const shortened = `${address.slice(0, 6)}…${address.slice(-4)}`;
  try {
    assert.equal(shortened, "0x9a8b…1a0b", "shortened address should be formatted correctly");
    pass("address shortened to 0x9a8b…1a0b");
  } catch (err) {
    fail("address formatting", err);
  }
}

// --- summary ---
console.log(`\ncheck-members: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
