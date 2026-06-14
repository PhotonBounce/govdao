// Generates Google Play promo screenshots (1080×1920) from manifest content.
// Deterministic, no headless browser — paints the dark theme, a phone status bar,
// a headline, and a feature panel per screen into a flat RGBA buffer.
//
// These are MARKETING graphics built from real app copy/theme — not live captures
// of the running app (which would require a device or emulator).
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { drawText, measureText } from "./lib/bitmap-font.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const manifest = require("../src/data/app.manifest.json");

// ── Dark palette (mirrors src/theme.ts darkPalette) ──────────────────────────
const OBSIDIAN = [0x0d, 0x0d, 0x1a];
const OBSIDIAN2 = [0x14, 0x12, 0x24];
const GLOW_BRONZE = [0xc9, 0x83, 0x40];
const SOFT_GOLD = [0xe8, 0xc8, 0x7a];
const DIM_WHITE = [0xe0, 0xdb, 0xd0];
const MUTED = [0x8a, 0x86, 0x7c];
const CARD = [0x1a, 0x1a, 0x2c];
const CARD_BORDER = [0x3a, 0x2e, 0x22];

const W = 1080;
const H = 1920;

// ── CRC32 + PNG writer ────────────────────────────────────────────────────────
const crcTable = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}
function writePngFromBuffer(filePath, width, height, pixels) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0;
    pixels.copy
      ? pixels.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4)
      : raw.set(pixels.subarray(y * width * 4, (y + 1) * width * 4), rowStart + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, png);
  console.log(`Wrote ${filePath} (${width}x${height}, ${png.length} bytes)`);
}

// ── Drawing primitives on a flat RGBA buffer ─────────────────────────────────
function newCanvas() {
  return new Uint8Array(W * H * 4);
}
function setPx(px, x, y, [r, g, b], a = 255) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const o = (y * W + x) * 4;
  px[o] = r;
  px[o + 1] = g;
  px[o + 2] = b;
  px[o + 3] = a;
}
function fillRect(px, x0, y0, w, h, color, a = 255) {
  for (let y = y0; y < y0 + h; y += 1) for (let x = x0; x < x0 + w; x += 1) setPx(px, x, y, color, a);
}
function fillRoundRect(px, x0, y0, w, h, radius, color, a = 255) {
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const inCorner =
        (x < radius && y < radius && (x - radius) ** 2 + (y - radius) ** 2 > radius ** 2) ||
        (x >= w - radius && y < radius && (x - (w - radius - 1)) ** 2 + (y - radius) ** 2 > radius ** 2) ||
        (x < radius && y >= h - radius && (x - radius) ** 2 + (y - (h - radius - 1)) ** 2 > radius ** 2) ||
        (x >= w - radius && y >= h - radius && (x - (w - radius - 1)) ** 2 + (y - (h - radius - 1)) ** 2 > radius ** 2);
      if (!inCorner) setPx(px, x0 + x, y0 + y, color, a);
    }
  }
}
function strokeRoundRect(px, x0, y0, w, h, radius, color, thickness = 3) {
  for (let t = 0; t < thickness; t += 1) {
    for (let x = radius; x < w - radius; x += 1) {
      setPx(px, x0 + x, y0 + t, color);
      setPx(px, x0 + x, y0 + h - 1 - t, color);
    }
    for (let y = radius; y < h - radius; y += 1) {
      setPx(px, x0 + t, y0 + y, color);
      setPx(px, x0 + w - 1 - t, y0 + y, color);
    }
  }
}
function verticalGradient(px) {
  for (let y = 0; y < H; y += 1) {
    const t = y / H;
    const c = [
      Math.round(OBSIDIAN[0] * (1 - t) + OBSIDIAN2[0] * t),
      Math.round(OBSIDIAN[1] * (1 - t) + OBSIDIAN2[1] * t),
      Math.round(OBSIDIAN[2] * (1 - t) + OBSIDIAN2[2] * t)
    ];
    for (let x = 0; x < W; x += 1) setPx(px, x, y, c);
  }
}
// Centered text helper
function drawCentered(px, text, cy, scale, color, spacing = 1) {
  const tw = measureText(text, scale, spacing);
  drawText(px, W, H, text, Math.round((W - tw) / 2), cy, scale, [...color, 255], spacing);
}
function drawLeft(px, text, x, y, scale, color, spacing = 1) {
  drawText(px, W, H, text, x, y, scale, [...color, 255], spacing);
}

// ── Phone status bar chrome ──────────────────────────────────────────────────
function statusBar(px) {
  fillRect(px, 0, 0, W, 70, OBSIDIAN);
  drawLeft(px, "9:41", 48, 24, 5, DIM_WHITE);
  // signal/battery dots on the right
  for (let i = 0; i < 4; i += 1) fillRect(px, W - 200 + i * 22, 30, 14, 18, DIM_WHITE);
  fillRoundRect(px, W - 96, 26, 56, 26, 6, DIM_WHITE);
}

// ── One screenshot ───────────────────────────────────────────────────────────
function screenshot(headline, sub, navLabel, bullets, badge) {
  const px = newCanvas();
  verticalGradient(px);
  statusBar(px);

  // Brand seal mark (concentric rings + GOVDAO)
  const cx = W / 2;
  const sealCy = 230;
  for (let y = -90; y <= 90; y += 1) {
    for (let x = -90; x <= 90; x += 1) {
      const d = Math.sqrt(x * x + y * y);
      if ((d > 78 && d < 86) || (d > 54 && d < 58)) setPx(px, cx + x, sealCy + y, GLOW_BRONZE);
    }
  }
  drawCentered(px, "GOVDAO", sealCy - 18, 6, SOFT_GOLD, 1.2);

  // Badge pill (plan / mode)
  if (badge) {
    const bScale = 4;
    const bw = measureText(badge, bScale, 1) + 48;
    fillRoundRect(px, Math.round((W - bw) / 2), 360, bw, 56, 28, CARD_BORDER);
    drawCentered(px, badge, 376, bScale, SOFT_GOLD);
  }

  // Headline
  drawCentered(px, headline, 470, 9, DIM_WHITE, 1);
  // Sub-headline (may wrap to 2 lines)
  const subLines = wrap(sub, 26);
  subLines.forEach((line, i) => drawCentered(px, line, 600 + i * 56, 4, MUTED));

  // Nav chip row mock — OVERVIEW, one default tab, then the active tab; no duplicates
  const navY = 760;
  const defaults = ["OVERVIEW", "PROPOSALS", "TREASURY"].filter((c) => c !== navLabel);
  const chips = [...defaults.slice(0, 2), navLabel];
  let chipX = 60;
  for (const chip of chips) {
    const active = chip === navLabel;
    const cw = measureText(chip, 3, 1) + 44;
    fillRoundRect(px, chipX, navY, cw, 60, 30, active ? GLOW_BRONZE : CARD);
    if (!active) strokeRoundRect(px, chipX, navY, cw, 60, 30, CARD_BORDER, 2);
    drawLeft(px, chip, chipX + 22, navY + 20, 3, active ? OBSIDIAN : MUTED);
    chipX += cw + 20;
  }

  // Feature card with bullets
  const cardY = 880;
  const cardH = 760;
  fillRoundRect(px, 60, cardY, W - 120, cardH, 36, CARD);
  strokeRoundRect(px, 60, cardY, W - 120, cardH, 36, CARD_BORDER, 3);
  drawLeft(px, navLabel, 110, cardY + 60, 6, SOFT_GOLD);
  fillRect(px, 110, cardY + 150, W - 220, 3, CARD_BORDER);

  bullets.forEach((b, i) => {
    const by = cardY + 210 + i * 130;
    // bullet dot
    for (let y = -10; y <= 10; y += 1) for (let x = -10; x <= 10; x += 1) if (x * x + y * y < 90) setPx(px, 130 + x, by + 14 + y, GLOW_BRONZE);
    const lines = wrap(b, 30);
    lines.forEach((line, li) => drawLeft(px, line, 180, by + li * 48, 4, DIM_WHITE));
  });

  // Footer
  drawCentered(px, "ON-CHAIN GOVERNANCE IN YOUR POCKET", H - 90, 3, MUTED, 1.2);
  return px;
}

function wrap(text, maxChars) {
  const words = text.toUpperCase().split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ── Screenshot definitions ───────────────────────────────────────────────────
const tagline = manifest.release?.listing?.shortDescription ?? "On-chain governance";
const planBadge = (manifest.features?.plan ?? "free").toUpperCase() + " PLAN";

const SCREENS = [
  {
    file: "01-overview.png",
    headline: "GOVERNANCE",
    sub: tagline,
    nav: "OVERVIEW",
    badge: manifest.governance?.mode?.toUpperCase() + " MODE",
    bullets: ["LIVE MEMBER REGISTRY ON-CHAIN", "QUORUM & PARTICIPATION AT A GLANCE", "WALLET OR PASSKEY SIGN-IN"]
  },
  {
    file: "02-proposals.png",
    headline: "VOTE ON-CHAIN",
    sub: "Cast binding votes with a verifiable receipt",
    nav: "PROPOSALS",
    badge: "VERIFIABLE",
    bullets: ["FOR / AGAINST / ABSTAIN BALLOTS", "CRYPTOGRAPHIC VOTE RECEIPT", "PROPOSAL INTEGRITY CHECK"]
  },
  {
    file: "03-treasury.png",
    headline: "TREASURY",
    sub: "Transparent spend with timelock protection",
    nav: "TREASURY",
    badge: "TIMELOCKED",
    bullets: ["PER-TRANSFER & DAILY SPEND CAPS", "TIMELOCKED SPEND REQUESTS", "EMERGENCY GUARDIAN DRILLS"]
  },
  {
    file: "04-analytics.png",
    headline: "ANALYTICS",
    sub: "Participation, pass rate and top delegates",
    nav: "ANALYTICS",
    badge: "PREMIUM",
    bullets: ["PARTICIPATION TREND SPARKBARS", "PASS / FAIL RATIO & QUORUM DISTANCE", "TOP DELEGATE LEADERBOARD"]
  },
  {
    file: "05-deploy.png",
    headline: "DEPLOY WIZARD",
    sub: "Bootstrap a governance instance in five steps",
    nav: "DEPLOY",
    badge: "PREMIUM",
    bullets: ["GUIDED 5-CONTRACT DEPLOYMENT", "PER-STEP ADDRESS & TX HASH", "EXPORT MANIFEST FRAGMENT"]
  }
];

const outDir = path.resolve(__dirname, "../../../config/play-store/screenshots");
for (const s of SCREENS) {
  const px = screenshot(s.headline, s.sub, s.nav, s.bullets, s.badge);
  writePngFromBuffer(path.join(outDir, s.file), W, H, Buffer.from(px));
}
console.log(`\nGenerated ${SCREENS.length} Play Store screenshots in ${outDir}`);
