/**
 * QA gate: monetization configuration is correct for a production build.
 * - plan must be "free" so the upgrade paywall is active
 * - pricingModel must be "subscription"
 * A plan of "premium" bypasses all gates and means nobody ever buys.
 * This gate catches that regression before it ships.
 */
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, "../src");

const manifest = require(path.join(srcDir, "data", "app.manifest.json"));

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ": " + detail : ""}`);
    failed++;
  }
}

console.log("Monetization: manifest plan");
assert(
  "plan is 'free' — paywall is active for production builds",
  manifest.features?.plan === "free",
  `got '${manifest.features?.plan}' — must be "free" so users hit the upgrade screen`
);
assert(
  "plan is not 'premium' (bypasses all gates — nobody can buy)",
  manifest.features?.plan !== "premium"
);

console.log("\nMonetization: release distribution");
assert(
  "distribution.pricingModel is 'subscription'",
  manifest.app?.distribution?.pricingModel === "subscription"
);
assert(
  "distribution.channel is 'google-play'",
  manifest.app?.distribution?.channel === "google-play"
);

console.log("\nMonetization: features flags");
assert("proposalFeed enabled",   manifest.features?.proposalFeed   === true);
assert("voting enabled",         manifest.features?.voting          === true);
assert("treasuryView enabled",   manifest.features?.treasuryView    === true);

console.log(`\ncheck-monetization: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
