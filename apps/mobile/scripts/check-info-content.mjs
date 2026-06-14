/**
 * QA gate: validates all info content entries have required fields
 * and body text is substantive.
 */

import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
    failed++;
  }
}

// Compile and load infoContent via ts-node inline eval
const tsFile = path.resolve(__dirname, "../src/data/infoContent.ts");
const js = execSync(
  `npx --yes ts-node --compiler-options '{"module":"CommonJS"}' --eval "const m = require('${tsFile}'); console.log(JSON.stringify(m.infoContent))"`,
  { cwd: path.resolve(__dirname, ".."), encoding: "utf8" }
);
const infoContent = JSON.parse(js.trim());

const EXPECTED_KEYS = [
  "overview",
  "member-registry",
  "governance-mode",
  "data-status",
  "launchpad",
  "offchain-auth",
  "member-session",
  "wallet-connect",
  "session-role",
  "proposals-list",
  "quorum",
  "voting-period",
  "proposal-integrity",
  "proposal-states",
  "vote-ballot",
  "vote-receipt",
  "vote-tally",
  "create-proposal",
  "proposal-doc",
  "motions-list",
  "motion-detail",
  "motion-decision",
  "decision-receipt",
  "treasury",
  "spend-cap",
  "treasury-movements",
  "spend-request",
  "timelock",
  "emergency-guardian",
  "guardian-threshold",
  "guardian-drill",
  "schedule-drill",
  "drill-types",
  "members-panel",
  "delegate-profile",
  "invite-member",
  "member-roles",
  "modules",
  "workspace",
  "activity-feed",
  "activity-filter",
  "app-settings",
  "notification-preferences",
  "notification-categories",
  "proposal-timeline",
];

console.log("\nInfoContent: all expected keys present");
for (const key of EXPECTED_KEYS) {
  assert(`key "${key}" present`, key in infoContent, `missing from infoContent`);
}

console.log("\nInfoContent: all entries have required fields");
for (const [key, entry] of Object.entries(infoContent)) {
  assert(`${key}.title is non-empty string`, typeof entry.title === "string" && entry.title.length > 0);
  assert(`${key}.body is ≥ 50 chars`, typeof entry.body === "string" && entry.body.length >= 50, `got ${entry.body?.length ?? 0}`);
}

console.log("\nInfoContent: example and onchain fields are strings when present");
for (const [key, entry] of Object.entries(infoContent)) {
  if (entry.example !== undefined) {
    assert(`${key}.example is string`, typeof entry.example === "string" && entry.example.length > 0);
  }
  if (entry.onchain !== undefined) {
    assert(`${key}.onchain is string`, typeof entry.onchain === "string" && entry.onchain.length > 0);
  }
}

console.log("\nInfoContent: entry count is at least 40");
assert(`total entries ≥ 40`, Object.keys(infoContent).length >= 40, `got ${Object.keys(infoContent).length}`);

console.log(`\ncheck-info-content: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
