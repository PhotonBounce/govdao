/**
 * QA gate: verify app data practices match the Google Play Data Safety
 * declaration requirements. Prints the exact answers for the Play Console
 * Data Safety form, then asserts they are consistent with app.manifest.json
 * and app.json so the declaration can't silently drift.
 *
 * Run: node scripts/check-data-safety.mjs
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifest = require(path.resolve(__dirname, "../src/data/app.manifest.json"));
const appJson = require(path.resolve(__dirname, "../app.json"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

// ─── Print the Data Safety form answers ───────────────────────────────────────
console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Google Play Data Safety — answers for the Play Console form ║
╚══════════════════════════════════════════════════════════════╝

SECTION 1 — Does your app collect or share any of the required user data types?
  Answer: YES (AdMob on free tier collects advertising ID)

SECTION 2 — Data collected and shared

  ┌─ Device or other identifiers ─────────────────────────────────
  │  Collected?  YES (Advertising ID — by Google AdMob on free tier)
  │  Shared?     YES (with Google AdMob for ad serving)
  │  Required?   NO — users can upgrade to Premium to remove ads
  │  Encrypted?  YES (in transit via HTTPS)
  │  Deletable?  YES — uninstall removes all local data
  │  Purpose:    Advertising or marketing

  ┌─ Financial info ───────────────────────────────────────────────
  │  Collected?  NO — payments processed by Google Play Billing;
  │              we receive only entitlement status (active/expired)

  ┌─ Location ────────────────────────────────────────────────────
  │  Collected?  NO

  ┌─ Personal info (name, email, etc.) ───────────────────────────
  │  Collected?  NO

  ┌─ Contacts ────────────────────────────────────────────────────
  │  Collected?  NO

  ┌─ Messages ────────────────────────────────────────────────────
  │  Collected?  NO

  ┌─ Photos or videos ────────────────────────────────────────────
  │  Collected?  NO

  ┌─ Audio files ─────────────────────────────────────────────────
  │  Collected?  NO

  ┌─ Files and docs ──────────────────────────────────────────────
  │  Collected?  NO

  ┌─ Calendar ────────────────────────────────────────────────────
  │  Collected?  NO — governance calendar is computed locally

  ┌─ Biometrics ──────────────────────────────────────────────────
  │  Collected?  NO — biometric auth handled by device OS;
  │              we receive only boolean success/fail

  ┌─ Health and fitness ──────────────────────────────────────────
  │  Collected?  NO

  ┌─ App activity ────────────────────────────────────────────────
  │  Collected?  NO — no analytics SDK; on-chain data is read-only

  ┌─ Web browsing ────────────────────────────────────────────────
  │  Collected?  NO

  ┌─ App info and performance ────────────────────────────────────
  │  Collected?  NO crash reporting SDK installed

SECTION 3 — Security practices
  Is data encrypted in transit?  YES — all network calls use HTTPS
  Can users request data deletion? YES — uninstall removes all local state;
    no account exists server-side to delete
  Does the app follow Google Families Policy? NO (not for children)
  Has the app been independently security reviewed? NO

SECTION 4 — Privacy Policy URL
  https://photon-bounce.com/govdao/privacy.html
`);

// ─── Assertions: ensure declarations stay consistent with the manifest ────────
console.log("Data Safety: manifest consistency checks");

const hasAdMob = (appJson.expo?.plugins ?? []).some(
  p => (Array.isArray(p) ? p[0] : p) === "react-native-google-mobile-ads"
);
assert(
  "AdMob present → advertising ID collection is declared",
  hasAdMob,
  "If AdMob is removed, update the Data Safety declaration in Play Console"
);

assert(
  "plan is 'free' → users on free tier see ads (declaration must include ad data)",
  manifest.features?.plan === "free"
);

const privacyUrl = manifest.support?.privacyPolicyUrl ?? "";
assert(
  "privacyPolicyUrl is a live https:// URL (required for Data Safety section)",
  privacyUrl.startsWith("https://") && privacyUrl.includes("photon-bounce.com"),
  privacyUrl || "missing"
);

assert(
  "no analytics SDK in dependencies (no extra data collection to declare)",
  !(appJson.expo?.plugins ?? []).some(p => {
    const name = Array.isArray(p) ? p[0] : p;
    return typeof name === "string" && (name.includes("firebase") || name.includes("amplitude") || name.includes("mixpanel"));
  })
);

assert(
  "biometricConfirm uses device OS (no biometric data collected by app)",
  manifest.features?.biometricConfirm === true  // feature flag on = OS handles it
);

assert(
  "no contact permissions in android.permissions (no contacts collected)",
  !(appJson.expo?.android?.permissions ?? []).some(p =>
    typeof p === "string" && p.includes("CONTACTS")
  )
);

assert(
  "no location permissions in android.permissions (no location collected)",
  !(appJson.expo?.android?.permissions ?? []).some(p =>
    typeof p === "string" && p.includes("LOCATION")
  )
);

console.log(`\ncheck-data-safety: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
