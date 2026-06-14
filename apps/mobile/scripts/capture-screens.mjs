/**
 * Full-app screenshot capture against the exported web build.
 *
 * Prereqs:
 *   - `EXPO_OFFLINE=1 npx expo export --platform web --output-dir dist`
 *   - a static server on BASE_URL (default http://127.0.0.1:8088)
 *   - playwright + a chromium install (PLAYWRIGHT_BROWSERS_PATH if non-default)
 *
 * Usage: node scripts/capture-screens.mjs [output-dir]
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);

function loadPlaywright() {
  const candidates = ["playwright", "/opt/node22/lib/node_modules/playwright"];
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      // try next
    }
  }
  throw new Error("playwright is not installed (looked in local node_modules and the global prefix)");
}

const { chromium } = loadPlaywright();

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:8088";
const OUTPUT_DIR = path.resolve(process.argv[2] ?? "/tmp/app-screens");
const VIEWPORT = { width: 390, height: 844 };

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });

let shotIndex = 0;
const captured = [];

async function capture(name) {
  shotIndex += 1;
  const file = path.join(OUTPUT_DIR, `${String(shotIndex).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  captured.push(file);
  console.log(`captured ${file}`);
}

async function clickText(text, { exact = false, last = false } = {}) {
  const locator = page.getByText(text, { exact });
  const target = last ? locator.last() : locator.first();
  await target.click({ timeout: 8000 });
  await page.waitForTimeout(400);
}

await page.goto(BASE_URL, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// 1. Overview (guest)
await capture("overview");

// 2. Sign in with the first wallet option, wait for the signed-in card
await clickText("WalletConnect", { exact: true });
await page.getByText("Sign Out", { exact: true }).waitFor({ timeout: 10000 });
await page.waitForTimeout(300);
await capture("signed-in");

// 3. Proposals view with quorum status card + search + filters
await clickText("Proposals", { exact: true });
await capture("proposals");

// 4. Proposal detail: integrity card + ballot
// Use the proposal title (not the ID, which also appears in the quorum status card)
await clickText("Ratify release operations checklist", { exact: false });
await page.waitForTimeout(900);
await capture("proposal-detail");

// 5. Cast a vote and capture the receipt with the explorer link
await clickText("For", { exact: true });
await page.getByText("Vote Receipt", { exact: false }).waitFor({ timeout: 10000 });
await page.waitForTimeout(300);
await capture("vote-receipt");

// 6. Motion detail with delegate decision panel
await clickText("Proposals", { exact: true });
await clickText("OPS-", { exact: false });
await page.waitForTimeout(500);
await capture("motion-detail");

// 7. Record a motion approval, capture the decision receipt
await clickText("Approve", { exact: true });
await page.getByText("Decision Receipt", { exact: false }).waitFor({ timeout: 10000 });
await page.waitForTimeout(300);
await capture("motion-decision-receipt");

// 8. Create-proposal form, filled
await clickText("Propose", { exact: true });
const inputs = page.locator("input, textarea");
await inputs.nth(0).fill("Expand the delegate onboarding cohort");
await inputs.nth(1).fill("Adds a second onboarding cohort so regional delegates can join governance before the next voting window.");
await page.waitForTimeout(200);
await capture("create-proposal-form");

// 9. Submit and capture the creation receipt
await clickText("Submit Proposal", { exact: true });
await page.getByText("Proposal Submitted", { exact: false }).waitFor({ timeout: 10000 });
await page.waitForTimeout(300);
await capture("create-proposal-receipt");

// 10. Treasury & Safety
await clickText("Treasury", { exact: true });
await page.waitForTimeout(600);
await capture("treasury");

// 11. Modules
await clickText("Modules", { exact: true });
await capture("modules");

// 12. Treasury spend request form, filled
await clickText("Treasury", { exact: true });
await page.waitForTimeout(400);
await clickText("Request Spend →", { exact: true });
await page.waitForTimeout(400);
const spendInputs = page.locator("input, textarea");
await spendInputs.nth(0).fill("Security tooling grant");
await spendInputs.nth(1).fill("5.0");
await spendInputs.nth(2).fill("0xA1b2C3d4E5f6a7B8C9d0E1f2A3B4C5D6E7F8a9B0");
await spendInputs.nth(3).fill("Fund security tooling maintenance for the guardian signer set.");
await page.waitForTimeout(200);
await capture("spend-request-form");

// 13. Submit spend request and capture the queued receipt
await clickText("Submit Spend Request", { exact: true });
await page.getByText("Spend Request Queued", { exact: false }).waitFor({ timeout: 10000 });
await page.waitForTimeout(300);
await capture("spend-request-receipt");

// 14. Activity log — all events, then filter to votes only
await clickText("Activity", { exact: true });
await capture("activity-all");
await page.getByText("Votes", { exact: true }).first().click();
await page.waitForTimeout(300);
await capture("activity-votes-filter");

// 18. Schedule guardian drill — form filled and receipt
await clickText("Drill", { exact: true });
await page.waitForTimeout(400);
await capture("schedule-drill-form");
// Sign in is already done; fill the notes field and submit
const drillInputs = page.locator("input, textarea");
await drillInputs.last().fill("Monthly pause drill — verify all 3 signers can co-sign within the 4h window.");
await page.waitForTimeout(200);
await clickText("Schedule Drill", { exact: true, last: true });
await page.getByText("Guardian Drill Queued", { exact: false }).waitFor({ timeout: 10000 });
await page.waitForTimeout(300);
await capture("schedule-drill-receipt");

// 19. Invite member — form filled and receipt
await clickText("Invite", { exact: true });
await page.waitForTimeout(400);
await capture("invite-member-form");
const inviteInputs = page.locator("input, textarea");
await inviteInputs.nth(0).fill("0xDeAdBeEf1234567890DeAdBeEf1234567890dEaD");
await clickText("Delegate", { exact: true });
await inviteInputs.last().fill("Eva Protocol");
await page.waitForTimeout(200);
await clickText("Submit Invitation", { exact: true });
await page.getByText("Member Invite Pending", { exact: false }).waitFor({ timeout: 10000 });
await page.waitForTimeout(300);
await capture("invite-member-receipt");

// 20. Settings with the notification preferences panel
await clickText("Settings", { exact: true });
await capture("settings");

// 21. Exercise notification preferences: toggle treasury alerts on, switch to
// daily digest, save, and capture the SAVED receipt.
const treasuryToggle = page.getByRole("switch").nth(3);
await treasuryToggle.click({ timeout: 8000 });
await clickText("Daily digest", { exact: true });
await clickText("Save Preferences", { exact: true });
await page.getByText("SAVED", { exact: true }).waitFor({ timeout: 10000 });
await page.waitForTimeout(300);
await capture("notification-preferences-saved");

await browser.close();

console.log(`\ncaptured ${captured.length} screens into ${OUTPUT_DIR}`);
