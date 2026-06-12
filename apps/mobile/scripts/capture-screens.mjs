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

// 3. Proposals view with search + filters
await clickText("Proposals", { exact: true });
await capture("proposals");

// 4. Proposal detail: integrity card + ballot
await clickText("GOV-", { exact: false });
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

// 12. Settings
await clickText("Settings", { exact: true });
await capture("settings");

await browser.close();

console.log(`\ncaptured ${captured.length} screens into ${OUTPUT_DIR}`);
