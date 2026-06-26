/**
 * QA gate: validates brand-consistent store screenshots across device sizes.
 * Phone (Play), iPhone (App Store 6.7"), 7" tablet, and 10" tablet.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../../config/play-store");

const NAMES = [
  "01-overview.png", "02-proposals.png", "04-treasury.png", "11-analytics.png",
  "12-deploy.png", "19-delegate-map.png", "20-risk-analyzer.png", "21-sentiment.png"
];

const DEVICES = [
  { dir: "screenshots", w: 1080, h: 1920, label: "Play phone" },
  { dir: "screenshots-iphone", w: 1290, h: 2796, label: "App Store iPhone 6.7\"" },
  { dir: "screenshots-tablet7", w: 1206, h: 2144, label: "7\" tablet" },
  { dir: "screenshots-tablet10", w: 1600, h: 2560, label: "10\" tablet" }
];

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

let passed = 0, failed = 0;
function assert(label, condition, detail = "") {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

for (const dev of DEVICES) {
  console.log(`\nScreenshots: ${dev.label} (${dev.w}×${dev.h})`);
  const dir = path.join(root, dev.dir);
  assert(`${dev.dir} has ≥ 2 screenshots (store minimum)`, NAMES.length >= 2);
  for (const name of NAMES) {
    const fp = path.join(dir, name);
    const exists = fs.existsSync(fp);
    assert(`${dev.dir}/${name} exists`, exists);
    if (!exists) continue;
    const buf = fs.readFileSync(fp);
    assert(`${name} has PNG magic bytes`, PNG_MAGIC.every((b, i) => buf[i] === b));
    assert(`${name} is ≥ 5000 bytes`, buf.length >= 5000, `got ${buf.length}`);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    assert(`${name} is ${dev.w}×${dev.h}`, width === dev.w && height === dev.h, `got ${width}×${height}`);
  }
}

console.log(`\ncheck-screenshots: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
