/**
 * QA gate: validates IAP config — entitlement/product identifiers, free-tier
 * offer gating, entitlement detection, and status copy. The native
 * react-native-purchases integration is platform-split and never enters web.
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
const iap = require(path.join(dataDir, "iapConfig.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

console.log("\nIAP: identifiers");
assert("premium entitlement id", iap.PREMIUM_ENTITLEMENT_ID === "premium");
assert("monthly + annual product ids present", iap.PREMIUM_PRODUCT_IDS.monthly.length > 0 && iap.PREMIUM_PRODUCT_IDS.annual.length > 0);
assert("product ids cover exactly monthly + annual", JSON.stringify(Object.keys(iap.PREMIUM_PRODUCT_IDS).sort()) === JSON.stringify(["annual", "monthly"]));
assert("product ids are distinct", iap.PREMIUM_PRODUCT_IDS.monthly !== iap.PREMIUM_PRODUCT_IDS.annual);

console.log("\nIAP: free-tier offer gating");
assert("offered to free plan", iap.iapOffered({ features: { plan: "free" } }) === true);
assert("not offered to premium plan", iap.iapOffered({ features: { plan: "premium" } }) === false);
assert("offered when plan missing (default free)", iap.iapOffered({ features: {} }) === true);

console.log("\nIAP: entitlement detection");
assert("entitled when premium active", iap.isPremiumEntitled(["premium"]) === true);
assert("entitled among several", iap.isPremiumEntitled(["foo", "premium", "bar"]) === true);
assert("not entitled otherwise", iap.isPremiumEntitled(["foo"]) === false);
assert("not entitled when empty", iap.isPremiumEntitled([]) === false);

console.log("\nIAP: status copy");
assert("purchased copy mentions active", /active/i.test(iap.describeIapStatus({ status: "purchased", premium: true, detail: "" })));
assert("ready copy invites upgrade", /upgrade/i.test(iap.describeIapStatus({ status: "ready", premium: false, detail: "" })));
assert("unconfigured copy mentions RevenueCat key", /revenuecat/i.test(iap.describeIapStatus({ status: "unconfigured", premium: false, detail: "" })));
assert("unsupported copy mentions native", /native/i.test(iap.describeIapStatus({ status: "unsupported", premium: false, detail: "" })));

console.log("\nIAP: unsupported state shape");
assert("UNSUPPORTED_IAP_STATE not premium", iap.UNSUPPORTED_IAP_STATE.premium === false && iap.UNSUPPORTED_IAP_STATE.status === "unsupported");

console.log(`\ncheck-iap-config: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
