/**
 * QA gate: validates Play Store screenshots exist with correct PNG magic + dimensions.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "../../../config/play-store/screenshots");

const EXPECTED = [
  "01-overview.png", "02-proposals.png", "03-propose.png", "04-treasury.png",
  "05-spend.png", "06-drill.png", "07-invite.png", "08-modules.png",
  "09-activity.png", "10-calendar.png", "11-analytics.png", "12-deploy.png",
  "13-settings.png", "14-upgrade.png", "15-search.png"
];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

let passed = 0, failed = 0;
function assert(label, condition, detail = "") {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

console.log("\nScreenshots: Google Play phone screenshots (1080×1920)");
assert("at least 2 screenshots (Play minimum)", EXPECTED.length >= 2);

for (const name of EXPECTED) {
  const fp = path.join(dir, name);
  const exists = fs.existsSync(fp);
  assert(`${name} exists`, exists);
  if (!exists) continue;
  const buf = fs.readFileSync(fp);
  assert(`${name} has PNG magic bytes`, PNG_MAGIC.every((b, i) => buf[i] === b));
  assert(`${name} is ≥ 5000 bytes`, buf.length >= 5000, `got ${buf.length}`);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  assert(`${name} is 1080×1920`, width === 1080 && height === 1920, `got ${width}×${height}`);
}

console.log(`\ncheck-screenshots: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
