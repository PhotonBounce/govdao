/**
 * Generates 6 minimal WAV files using raw PCM math.
 * Output: apps/mobile/assets/sounds/*.wav
 * All sounds are mono, 44100 Hz, 16-bit signed PCM.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../assets/sounds");
fs.mkdirSync(OUT, { recursive: true });

function writeWav(samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buf;
}

function bell(n) {
  return (i) => Math.sin(Math.PI * i / n);
}

function sine(freq) {
  return (i) => Math.sin(2 * Math.PI * freq * i / SR);
}

function generate(durationSecs, fn) {
  const n = Math.round(SR * durationSecs);
  return Array.from({ length: n }, (_, i) => fn(i, n));
}

// tap.wav — 12ms, 800 Hz, bell envelope
const tap = generate(0.012, (i, n) => bell(n)(i) * sine(800)(i) * 0.55);
fs.writeFileSync(path.join(OUT, "tap.wav"), writeWav(tap));

// success.wav — 80ms, 523 Hz + 659 Hz major third chord, bell envelope
const success = generate(0.080, (i, n) => bell(n)(i) * (sine(523)(i) + sine(659)(i)) * 0.30);
fs.writeFileSync(path.join(OUT, "success.wav"), writeWav(success));

// error.wav — 60ms, 220 Hz descending (220→180), bell envelope
const error = generate(0.060, (i, n) => {
  const freq = 220 - 40 * (i / n);
  return bell(n)(i) * Math.sin(2 * Math.PI * freq * i / SR) * 0.50;
});
fs.writeFileSync(path.join(OUT, "error.wav"), writeWav(error));

// vote.wav — 100ms, 440→660 Hz sweep, bell envelope
const vote = generate(0.100, (i, n) => {
  const freq = 440 + 220 * (i / n);
  return bell(n)(i) * Math.sin(2 * Math.PI * freq * i / SR) * 0.45;
});
fs.writeFileSync(path.join(OUT, "vote.wav"), writeWav(vote));

// receipt.wav — 120ms, tri-tone ascending (523→659→784), bell envelope
const receipt = generate(0.120, (i, n) => {
  const step = Math.floor(i / (n / 3));
  const freqs = [523, 659, 784];
  return bell(n)(i) * sine(freqs[Math.min(step, 2)])(i) * 0.40;
});
fs.writeFileSync(path.join(OUT, "receipt.wav"), writeWav(receipt));

// scroll-snap.wav — 8ms, 1200 Hz click, linear fade-out
const scrollSnap = generate(0.008, (i, n) => (1 - i / n) * sine(1200)(i) * 0.45);
fs.writeFileSync(path.join(OUT, "scroll-snap.wav"), writeWav(scrollSnap));

const files = ["tap.wav", "success.wav", "error.wav", "vote.wav", "receipt.wav", "scroll-snap.wav"];
console.log(`Generated ${files.length} sounds into ${OUT}`);
files.forEach((f) => {
  const stat = fs.statSync(path.join(OUT, f));
  console.log(`  ${f}: ${stat.size} bytes`);
});
