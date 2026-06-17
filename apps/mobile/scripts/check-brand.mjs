/**
 * QA gate: brand consistency.
 * Verifies the G-coin brand is wired end-to-end — assets, fonts, palette,
 * tagline, and the generators that reproduce them.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobile = path.resolve(__dirname, "..");
const repo = path.resolve(__dirname, "../../..");

let passed = 0, failed = 0;
function assert(label, cond, detail = "") {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}
const read = (p) => { try { return fs.readFileSync(p, "utf8"); } catch { return ""; } };
const exists = (p) => fs.existsSync(p);

const TAGLINE = "On-chain governance, in your pocket.";

console.log("\nBrand: source generators present");
assert("generate-brand.py exists", exists(path.join(mobile, "scripts/generate-brand.py")));
assert("generate-store-screenshots.py exists", exists(path.join(mobile, "scripts/generate-store-screenshots.py")));

console.log("\nBrand: master logo + icon assets");
for (const f of ["logo-g.png", "icon.png", "adaptive-icon.png", "splash.png", "feature-graphic.png"]) {
  assert(`assets/${f} exists`, exists(path.join(mobile, "assets", f)));
}

console.log("\nBrand: elegant serif typography wired into the app");
const theme = read(path.join(mobile, "src/theme.ts"));
assert("theme exports fonts.serif", /export const fonts\b/.test(theme) && /serif:/.test(theme));
assert("theme exports brand palette (teal + gold)", /export const brand\b/.test(theme) && /teal:/.test(theme) && /gold:/.test(theme));
assert("App.tsx title uses fonts.serif", /fontFamily:\s*fonts\.serif/.test(read(path.join(mobile, "App.tsx"))));
assert("SectionCard title uses fonts.serif", /fontFamily:\s*fonts\.serif/.test(read(path.join(mobile, "src/components/SectionCard.tsx"))));

console.log("\nBrand: tagline is consistent across surfaces");
assert("tagline in generate-brand.py", read(path.join(mobile, "scripts/generate-brand.py")).includes(TAGLINE));
assert("tagline in store-screenshots", read(path.join(mobile, "scripts/generate-store-screenshots.py")).includes(TAGLINE));
assert("tagline in Play store listing", read(path.join(repo, "config/play-store/store-listing.md")).includes(TAGLINE));

console.log("\nBrand: no legacy top-hat seal asset committed");
assert("logo.png (old seal hook) absent at repo root", !exists(path.join(repo, "logo.png")));

console.log(`\ncheck-brand: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
