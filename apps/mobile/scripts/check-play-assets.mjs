/**
 * QA gate: validates all required Google Play Store PNG assets.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, "../assets");

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
    failed++;
  }
}

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function checkPng(filename, expectedWidth, expectedHeight, minBytes = 1000) {
  const filepath = path.join(assetsDir, filename);
  const exists = fs.existsSync(filepath);
  assert(`${filename} exists`, exists, filepath);
  if (!exists) {
    failed += 3;
    return;
  }
  const data = fs.readFileSync(filepath);
  assert(`${filename} has PNG magic bytes`, data.slice(0, 8).equals(PNG_MAGIC));
  assert(`${filename} is ≥ ${minBytes} bytes`, data.length >= minBytes, `got ${data.length}`);
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  assert(`${filename} is ${expectedWidth}×${expectedHeight}`, width === expectedWidth && height === expectedHeight, `got ${width}×${height}`);
}

console.log("\nPlay Store assets: app icon");
checkPng("icon.png", 1024, 1024, 4000);

console.log("\nPlay Store assets: adaptive icon foreground");
checkPng("adaptive-icon.png", 1024, 1024, 2000);

console.log("\nPlay Store assets: splash screen");
checkPng("splash.png", 1080, 1920, 4000);

console.log("\nPlay Store assets: feature graphic");
checkPng("feature-graphic.png", 1024, 500, 2000);

console.log(`\ncheck-play-assets: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
