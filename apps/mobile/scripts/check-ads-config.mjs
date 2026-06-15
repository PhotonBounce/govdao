/**
 * QA gate: validates AdMob config — unit IDs, free-tier gating, test-vs-prod
 * selection, and the interstitial throttle. The native SDK itself is platform-split
 * (AdBanner.native.tsx / useInterstitialAd.native.ts) and never enters the web build.
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", esModuleInterop: true },
});

const dataDir = path.resolve(process.cwd(), "src", "data");
const ads = require(path.join(dataDir, "adsConfig.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

const UNIT_RE = /^ca-app-pub-\d+\/\d+$/;
const APP_ID_RE = /^ca-app-pub-\d+~\d+$/;

console.log("\nAds: identifiers");
assert("App ID has the ~ form", APP_ID_RE.test(ads.ADMOB_APP_ID), ads.ADMOB_APP_ID);
assert("App ID matches the provided AdMob app", ads.ADMOB_APP_ID === "ca-app-pub-7584543130600454~4392371847");
assert("banner unit id has the / form", UNIT_RE.test(ads.AD_UNIT_IDS.banner), ads.AD_UNIT_IDS.banner);
assert("banner unit id matches provided", ads.AD_UNIT_IDS.banner === "ca-app-pub-7584543130600454/5417383754");
assert("interstitial unit id matches provided", ads.AD_UNIT_IDS.interstitial === "ca-app-pub-7584543130600454/5828742449");
assert("test unit ids are Google's samples", ads.TEST_AD_UNIT_IDS.banner.startsWith("ca-app-pub-3940256099942544/"));

console.log("\nAds: free-tier gating");
assert("ads enabled for free plan", ads.adsEnabled({ features: { plan: "free" } }) === true);
assert("ads disabled for premium plan", ads.adsEnabled({ features: { plan: "premium" } }) === false);
assert("ads enabled when plan missing (defaults free)", ads.adsEnabled({ features: {} }) === true);

console.log("\nAds: test-vs-prod unit selection");
assert("banner test mode returns test id", ads.bannerUnitId(true) === ads.TEST_AD_UNIT_IDS.banner);
assert("banner prod mode returns real id", ads.bannerUnitId(false) === ads.AD_UNIT_IDS.banner);
assert("interstitial test mode returns test id", ads.interstitialUnitId(true) === ads.TEST_AD_UNIT_IDS.interstitial);
assert("interstitial prod mode returns real id", ads.interstitialUnitId(false) === ads.AD_UNIT_IDS.interstitial);

console.log("\nAds: interstitial throttle");
assert("no interstitial at nav 0", ads.shouldShowInterstitial(0) === false);
assert("no interstitial before the interval", ads.shouldShowInterstitial(ads.INTERSTITIAL_NAV_INTERVAL - 1) === false);
assert("interstitial fires at the interval", ads.shouldShowInterstitial(ads.INTERSTITIAL_NAV_INTERVAL) === true);
assert("interstitial fires at 2x the interval", ads.shouldShowInterstitial(ads.INTERSTITIAL_NAV_INTERVAL * 2) === true);

console.log(`\ncheck-ads-config: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
