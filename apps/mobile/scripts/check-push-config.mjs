/**
 * QA gate: validates push-notification config — feature gating, Android channels,
 * token truncation, and status copy. The native expo-notifications integration is
 * platform-split (usePushNotifications.native.ts) and never enters the web build.
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
const push = require(path.join(dataDir, "pushConfig.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

console.log("\nPush: feature gating");
assert("enabled when pushNotifications true", push.pushEnabled({ features: { pushNotifications: true } }) === true);
assert("disabled when pushNotifications false", push.pushEnabled({ features: { pushNotifications: false } }) === false);
assert("disabled when feature absent", push.pushEnabled({ features: {} }) === false);

console.log("\nPush: Android channels from features");
const base = push.pushChannels({ features: { pushNotifications: true } });
const baseIds = base.map((c) => c.id);
assert("always includes governance + guardian", baseIds.includes("governance") && baseIds.includes("guardian"));
assert("no votes channel when voting off", !baseIds.includes("votes"));
const full = push.pushChannels({ features: { pushNotifications: true, voting: true, treasuryView: true } });
const fullIds = full.map((c) => c.id);
assert("votes channel when voting on", fullIds.includes("votes"));
assert("treasury channel when treasuryView on", fullIds.includes("treasury"));
assert("every channel has name + importance", full.every((c) => c.name.length > 0 && ["high", "default", "low"].includes(c.importance)));

console.log("\nPush: token truncation");
assert("null token → dash", push.shortenToken(null) === "—");
const t = push.shortenToken("ExponentPushToken[abcdef1234567890]");
assert("wrapped token keeps wrapper + ellipsis", t.startsWith("ExponentPushToken[") && t.endsWith("]") && t.includes("…"), t);
assert("short raw token returned as-is", push.shortenToken("short") === "short");

console.log("\nPush: status copy");
assert("granted copy mentions enabled", /enabled/i.test(push.describePushStatus("granted")));
assert("denied copy mentions settings", /settings/i.test(push.describePushStatus("denied")));
assert("undetermined copy prompts enable", /enable|allow|tap/i.test(push.describePushStatus("undetermined")));
assert("unsupported copy mentions native/device", /native|device/i.test(push.describePushStatus("unsupported")));
assert("UNSUPPORTED_PUSH_STATE shape", push.UNSUPPORTED_PUSH_STATE.supported === false && push.UNSUPPORTED_PUSH_STATE.token === null);

console.log(`\ncheck-push-config: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
