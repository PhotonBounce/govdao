/**
 * QA gate: baseline screen-reader accessibility. The core interactive
 * primitive (AnimatedPressable) must expose a role + label + disabled state so
 * every button/tab built on it is announced correctly by TalkBack/VoiceOver,
 * and the high-traffic wrappers must forward a meaningful label.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const components = path.resolve(__dirname, "../src/components");
const read = (rel) => readFileSync(path.join(components, rel), "utf8");

let passed = 0, failed = 0;
function assert(label, cond, detail = "") {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

console.log("\nAccessibility: AnimatedPressable primitive");
const ap = read("AnimatedPressable.tsx");
assert("accepts accessibilityLabel prop", /accessibilityLabel\?:\s*string/.test(ap));
assert("forwards accessibilityRole (default button)", /accessibilityRole\s*=\s*"button"/.test(ap) && /accessibilityRole=\{accessibilityRole\}/.test(ap));
assert("forwards accessibilityLabel to Pressable", /accessibilityLabel=\{accessibilityLabel\}/.test(ap));
assert("reflects disabled state to a11y", /accessibilityState=\{\{\s*disabled\s*\}\}/.test(ap));

console.log("\nAccessibility: high-traffic wrappers forward a label");
const btn = read("AnimatedButton.tsx");
assert("AnimatedButton labels itself from its text", /accessibilityLabel=\{label\}/.test(btn));
const nav = read("NavTab.tsx");
assert("NavTab uses the tab role", /accessibilityRole="tab"/.test(nav));
assert("NavTab announces selection state", /selected/.test(nav) && /accessibilityLabel=\{`\$\{label\}/.test(nav));

console.log(`\ncheck-accessibility: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
