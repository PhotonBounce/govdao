/**
 * QA gate: validates the App Preferences model — defaults, toggling, immutability,
 * normalization of untrusted input, and the info-content help entry.
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", esModuleInterop: true },
});

const root = path.resolve(process.cwd(), "src", "data");
const prefs = require(path.join(root, "preferencesSource.ts"));
const { infoContent } = require(path.join(root, "infoContent.ts"));

let passed = 0, failed = 0;
function assert(label, condition, detail = "") {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

const { DEFAULT_PREFERENCES, PREFERENCE_ORDER, PREFERENCE_META, togglePreference, setPreference, normalizePreferences, countEnabled, summarizePreferences, isPreferenceKey } = prefs;

console.log("\nPreferences: defaults + metadata");
assert("4 preference keys", PREFERENCE_ORDER.length === 4, `got ${PREFERENCE_ORDER.length}`);
assert("sound on by default", DEFAULT_PREFERENCES.soundEnabled === true);
assert("reduceMotion off by default", DEFAULT_PREFERENCES.reduceMotion === false);
assert("every key has label + description", PREFERENCE_ORDER.every((k) => PREFERENCE_META[k].label.length > 0 && PREFERENCE_META[k].description.length >= 10));
assert("isPreferenceKey true for known", isPreferenceKey("soundEnabled") === true);
assert("isPreferenceKey false for unknown", isPreferenceKey("bogus") === false);

console.log("\nPreferences: toggle (immutable)");
const base = { ...DEFAULT_PREFERENCES };
const toggled = togglePreference(base, "reduceMotion");
assert("toggled value flips", toggled.reduceMotion === true);
assert("original object untouched", base.reduceMotion === false);
assert("toggle returns new object", toggled !== base);
assert("double toggle restores", togglePreference(toggled, "reduceMotion").reduceMotion === false);

console.log("\nPreferences: setPreference");
const set = setPreference(base, "soundEnabled", false);
assert("set explicit value", set.soundEnabled === false);
assert("set is immutable", base.soundEnabled === true && set !== base);

console.log("\nPreferences: normalize untrusted input");
assert("null → defaults", JSON.stringify(normalizePreferences(null)) === JSON.stringify(DEFAULT_PREFERENCES));
assert("partial merges over defaults", normalizePreferences({ reduceMotion: true }).reduceMotion === true);
assert("partial keeps other defaults", normalizePreferences({ reduceMotion: true }).soundEnabled === true);
assert("unknown keys dropped", !("bogus" in normalizePreferences({ bogus: 1, soundEnabled: false })));
assert("non-boolean ignored", normalizePreferences({ soundEnabled: "yes" }).soundEnabled === true);

console.log("\nPreferences: summaries");
assert("countEnabled all-on is 4", countEnabled({ soundEnabled: true, reduceMotion: true, hapticsEnabled: true, compactNav: true }) === 4);
assert("countEnabled defaults is 2 (sound + haptics)", countEnabled(DEFAULT_PREFERENCES) === 2, `got ${countEnabled(DEFAULT_PREFERENCES)}`);
assert("summary mentions sound state", summarizePreferences(DEFAULT_PREFERENCES).includes("sound on"));
assert("summary reflects reduced motion", summarizePreferences({ ...DEFAULT_PREFERENCES, reduceMotion: true }).includes("motion reduced"));

console.log("\nPreferences: info-content help entry");
assert("'preferences' info entry exists", !!infoContent.preferences);
assert("preferences body >= 50 chars", (infoContent.preferences?.body ?? "").length >= 50);

console.log(`\ncheck-preferences: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
