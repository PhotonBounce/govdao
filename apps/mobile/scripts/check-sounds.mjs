/**
 * QA gate: validates all 6 WAV sound files exist and have valid RIFF headers.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOUNDS_DIR = path.resolve(__dirname, "../assets/sounds");

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

const EXPECTED = ["tap.wav", "success.wav", "error.wav", "vote.wav", "receipt.wav", "scroll-snap.wav"];

console.log("\nSounds: all expected files exist");
for (const name of EXPECTED) {
  const p = path.join(SOUNDS_DIR, name);
  assert(`${name} exists`, fs.existsSync(p));
}

console.log("\nSounds: valid RIFF/WAVE header");
for (const name of EXPECTED) {
  const p = path.join(SOUNDS_DIR, name);
  if (!fs.existsSync(p)) continue;
  const buf = fs.readFileSync(p);
  assert(`${name} RIFF magic`, buf.toString("ascii", 0, 4) === "RIFF", `got ${buf.toString("ascii", 0, 4)}`);
  assert(`${name} WAVE magic`, buf.toString("ascii", 8, 12) === "WAVE", `got ${buf.toString("ascii", 8, 12)}`);
  assert(`${name} non-zero size`, buf.length > 44, `got ${buf.length} bytes`);
}

console.log("\nSounds: file sizes within expected range");
const SIZE_RANGES = {
  "tap.wav": [500, 5000],
  "success.wav": [5000, 30000],
  "error.wav": [3000, 20000],
  "vote.wav": [6000, 30000],
  "receipt.wav": [8000, 40000],
  "scroll-snap.wav": [200, 2000],
};
for (const [name, [min, max]] of Object.entries(SIZE_RANGES)) {
  const p = path.join(SOUNDS_DIR, name);
  if (!fs.existsSync(p)) continue;
  const size = fs.statSync(p).size;
  assert(`${name} size in range [${min}, ${max}]`, size >= min && size <= max, `got ${size} bytes`);
}

console.log(`\ncheck-sounds: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
