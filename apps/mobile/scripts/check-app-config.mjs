/**
 * QA gate: validates app.json (Expo config) for Google Play submission.
 * Catches common pre-submission mistakes: wrong interface style, missing
 * bundle ID, placeholder AdMob IDs, missing permissions list, wrong version.
 */
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appJson = require(path.resolve(__dirname, "../app.json"));
const expo = appJson.expo;
const android = expo.android ?? {};
const ios = expo.ios ?? {};
const plugins = expo.plugins ?? [];

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

console.log("app.json: identity");
assert("name is set", typeof expo.name === "string" && expo.name.length > 0);
assert("slug is set", typeof expo.slug === "string" && expo.slug.length > 0);
assert("version is semver-like", /^\d+\.\d+\.\d+$/.test(expo.version ?? ""));
assert("scheme is set (deep-links)", typeof expo.scheme === "string" && expo.scheme.length > 0);

console.log("\napp.json: Android");
assert("android.package is set", typeof android.package === "string" && android.package.includes("."));
assert("android.versionCode is a positive integer", Number.isInteger(android.versionCode) && android.versionCode > 0);
assert("android.adaptiveIcon.foregroundImage is set", typeof android.adaptiveIcon?.foregroundImage === "string");
assert("android.permissions is defined (empty array is fine)", Array.isArray(android.permissions));

console.log("\napp.json: UX");
assert(
  "userInterfaceStyle is 'dark' (app uses dark palette)",
  expo.userInterfaceStyle === "dark",
  `got '${expo.userInterfaceStyle}'`
);
assert("orientation is portrait", expo.orientation === "portrait");
assert("splash backgroundColor matches dark theme", expo.splash?.backgroundColor?.toLowerCase() === "#0d0d1a");

console.log("\napp.json: assets");
assert("icon path is set", typeof expo.icon === "string" && expo.icon.length > 0);
assert("splash image path is set", typeof expo.splash?.image === "string");

console.log("\napp.json: plugins");
const hasAdMob = plugins.some(p => (Array.isArray(p) ? p[0] : p) === "react-native-google-mobile-ads");
const hasNotifications = plugins.some(p => (Array.isArray(p) ? p[0] : p) === "expo-notifications");
assert("react-native-google-mobile-ads plugin present", hasAdMob);
assert("expo-notifications plugin present", hasNotifications);

const admobPlugin = plugins.find(p => (Array.isArray(p) ? p[0] : p) === "react-native-google-mobile-ads");
const admobConfig = Array.isArray(admobPlugin) ? admobPlugin[1] : {};
assert("AdMob androidAppId is not empty", typeof admobConfig.androidAppId === "string" && admobConfig.androidAppId.startsWith("ca-app-pub-"));

console.log(`\ncheck-app-config: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
