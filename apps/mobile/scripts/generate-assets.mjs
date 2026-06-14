// Generates PNG assets from the brand palette — reproducible from source, no image library.
// When logo.png exists at the repo root (or GOVDAO_LOGO_PATH is set), it is composited
// onto the icon/splash backgrounds instead of the algorithmic seal.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Palette ──────────────────────────────────────────────────────────────────
const SAND        = [0xf3, 0xef, 0xe3, 255];
const GRAPHITE    = [0x1f, 0x1b, 0x18, 255];
const BRONZE      = [0x8e, 0x5c, 0x32, 255];
const PAPER       = [0xfb, 0xf8, 0xef, 255];
const TRANSPARENT = [0, 0, 0, 0];
const OBSIDIAN    = [0x0d, 0x0d, 0x1a, 255];
const OBSIDIAN2   = [0x0a, 0x1a, 0x14, 255];
const SOFT_GOLD   = [0xe8, 0xc8, 0x7a, 255];
const GLOW_BRONZE = [0xc9, 0x83, 0x40, 255];

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

function writePng(filePath, width, height, pixelAt) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = pixelAt(x, y);
      const offset = rowStart + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
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

// ── PNG decoder (minimal; 8-bit RGB/RGBA, no interlace) ──────────────────────
function decodePng(filepath) {
  let data;
  try { data = fs.readFileSync(filepath); } catch { return null; }
  const MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) if (data[i] !== MAGIC[i]) return null;

  let pos = 8;
  let width = 0, height = 0, channels = 4;
  const idatChunks = [];

  while (pos + 12 <= data.length) {
    const length = data.readUInt32BE(pos);
    const type = data.toString("ascii", pos + 4, pos + 8);
    const cd = data.slice(pos + 8, pos + 8 + length);
    pos += 12 + length;
    if (type === "IHDR") {
      width = cd.readUInt32BE(0);
      height = cd.readUInt32BE(4);
      const bitDepth = cd[8], colorType = cd[9];
      if (cd[12] !== 0 || bitDepth !== 8) return null;
      channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 4;
    } else if (type === "IDAT") {
      idatChunks.push(cd);
    } else if (type === "IEND") break;
  }
  if (!width || !height) return null;

  let raw;
  try { raw = zlib.inflateSync(Buffer.concat(idatChunks)); } catch { return null; }

  const rowBytes = width * channels;
  const pixels = new Uint8Array(width * height * 4);
  const prev = new Uint8Array(rowBytes);

  function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  }

  for (let y = 0; y < height; y += 1) {
    const f = raw[y * (rowBytes + 1)];
    const cur = new Uint8Array(rowBytes);
    for (let x = 0; x < rowBytes; x += 1) {
      const v = raw[y * (rowBytes + 1) + 1 + x];
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      cur[x] = f === 0 ? v
             : f === 1 ? (v + a) & 0xff
             : f === 2 ? (v + b) & 0xff
             : f === 3 ? (v + Math.floor((a + b) / 2)) & 0xff
             : (v + paeth(a, b, c)) & 0xff;
    }
    for (let x = 0; x < width; x += 1) {
      const pi = (y * width + x) * 4;
      if (channels === 4) {
        pixels[pi] = cur[x * 4]; pixels[pi + 1] = cur[x * 4 + 1];
        pixels[pi + 2] = cur[x * 4 + 2]; pixels[pi + 3] = cur[x * 4 + 3];
      } else {
        pixels[pi] = cur[x * 3]; pixels[pi + 1] = cur[x * 3 + 1];
        pixels[pi + 2] = cur[x * 3 + 2]; pixels[pi + 3] = 255;
      }
    }
    prev.set(cur);
  }
  return { width, height, pixels };
}

// ── Governance seal (original, for SAND/light backgrounds) ───────────────────
function sealPixel(x, y, cx, cy, scale, background) {
  const dx = x - cx, dy = y - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > 0.46 * scale) return background;
  if (distance > 0.40 * scale) return BRONZE;
  if (Math.abs(dy + 0.06 * scale) < 0.035 * scale && Math.abs(dx) < 0.22 * scale) return PAPER;
  if (dy < -0.095 * scale && dy > -0.30 * scale && Math.abs(dx) < 0.13 * scale) return BRONZE;
  return GRAPHITE;
}

// ── Seal variant for dark backgrounds ────────────────────────────────────────
function sealDarkPixel(x, y, cx, cy, scale, background) {
  const dx = x - cx, dy = y - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > 0.46 * scale) return background;
  if (distance > 0.40 * scale) return GLOW_BRONZE;
  if (Math.abs(dy + 0.06 * scale) < 0.035 * scale && Math.abs(dx) < 0.22 * scale) return SOFT_GOLD;
  if (dy < -0.095 * scale && dy > -0.30 * scale && Math.abs(dx) < 0.13 * scale) return GLOW_BRONZE;
  return [0x2a, 0x24, 0x38, 255];
}

// ── Logo compositing ──────────────────────────────────────────────────────────
function logoBlend(x, y, cx, cy, fillSize, logo, background) {
  if (!logo) return sealPixel(x, y, cx, cy, fillSize, background);
  const scale = Math.min(logo.width, logo.height) / fillSize;
  const sx = Math.round((x - cx) * scale + logo.width / 2);
  const sy = Math.round((y - cy) * scale + logo.height / 2);
  if (sx < 0 || sx >= logo.width || sy < 0 || sy >= logo.height) return background;
  const pi = (sy * logo.width + sx) * 4;
  const alpha = logo.pixels[pi + 3] / 255;
  if (alpha < 0.05) return background;
  return [
    Math.round(logo.pixels[pi] * alpha + background[0] * (1 - alpha)),
    Math.round(logo.pixels[pi + 1] * alpha + background[1] * (1 - alpha)),
    Math.round(logo.pixels[pi + 2] * alpha + background[2] * (1 - alpha)),
    255
  ];
}

// ── Bitmap font (5×5 glyphs, rendered at arbitrary scale) ────────────────────
const GLYPHS = {
  G: ["01110", "10000", "10011", "10001", "01111"],
  O: ["01110", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "01010", "01010", "00100"],
  D: ["11110", "10001", "10001", "10001", "11110"],
  A: ["01110", "10001", "11111", "10001", "10001"],
  " ": ["00000", "00000", "00000", "00000", "00000"]
};

function isGlyphPixel(x, y, text, startX, startY, scale) {
  const glyphW = 5, glyphH = 5, gap = Math.max(2, Math.floor(scale * 0.35));
  for (let ci = 0; ci < text.length; ci += 1) {
    const glyph = GLYPHS[text[ci]];
    if (!glyph) continue;
    const gx = x - startX - ci * (glyphW * scale + gap);
    const gy = y - startY;
    if (gx < 0 || gx >= glyphW * scale || gy < 0 || gy >= glyphH * scale) continue;
    const col = Math.floor(gx / scale), row = Math.floor(gy / scale);
    if (glyph[row] && glyph[row][col] === "1") return true;
  }
  return false;
}

// ── Dark gradient background for feature graphic ──────────────────────────────
function featureBg(x, y, width, height) {
  const tx = x / width, ty = y / height;
  return [
    Math.round(OBSIDIAN[0] * (1 - tx) + OBSIDIAN2[0] * tx),
    Math.round(OBSIDIAN[1] * (1 - ty) + OBSIDIAN2[1] * ty + ty * 6),
    Math.round(OBSIDIAN[2] + ty * 10),
    255
  ];
}

// ── Logo detection ────────────────────────────────────────────────────────────
const repoRoot = path.resolve(__dirname, "../../../");
const logoPath = process.env.GOVDAO_LOGO_PATH ?? path.join(repoRoot, "logo.png");
const logo = decodePng(logoPath);
if (logo) {
  console.log(`Logo loaded: ${logoPath} (${logo.width}×${logo.height})`);
} else {
  console.log("No logo.png found — using algorithmic seal");
}

const assetsDir = path.resolve(__dirname, "../assets");

// Icon 1024×1024
writePng(path.join(assetsDir, "icon.png"), 1024, 1024, (x, y) =>
  logo
    ? logoBlend(x, y, 512, 512, 800, logo, OBSIDIAN)
    : sealPixel(x, y, 512, 512, 1024, SAND)
);

// Adaptive icon 1024×1024 (transparent background)
writePng(path.join(assetsDir, "adaptive-icon.png"), 1024, 1024, (x, y) =>
  logo
    ? logoBlend(x, y, 512, 512, 660, logo, TRANSPARENT)
    : sealPixel(x, y, 512, 512, 660, TRANSPARENT)
);

// Splash 1080×1920
writePng(path.join(assetsDir, "splash.png"), 1080, 1920, (x, y) =>
  logo
    ? logoBlend(x, y, 540, 960, 560, logo, OBSIDIAN)
    : sealPixel(x, y, 540, 960, 560, SAND)
);

// Feature graphic 1024×500 — dark gradient, seal left, "GOVDAO" wordmark right
const TEXT_SCALE = 14;
const GLYPH_W = 5 * TEXT_SCALE;
const GLYPH_GAP = Math.max(2, Math.floor(TEXT_SCALE * 0.35));
const WORD = "GOVDAO";
const WORD_W = WORD.length * (GLYPH_W + GLYPH_GAP) - GLYPH_GAP;
const WORD_H = 5 * TEXT_SCALE;
const WORD_START_X = Math.round(420 + (580 - WORD_W) / 2);
const WORD_START_Y = Math.round((500 - WORD_H) / 2);

function sealDarkHit(x, y, cx, cy, scale) {
  const dx = x - cx, dy = y - cy;
  return Math.sqrt(dx * dx + dy * dy) <= 0.46 * scale;
}

writePng(path.join(assetsDir, "feature-graphic.png"), 1024, 500, (x, y) => {
  const bg = featureBg(x, y, 1024, 500);

  // Left zone: seal or logo mark
  if (x < 380) {
    if (logo) {
      const px = logoBlend(x, y, 190, 250, 280, logo, bg);
      if (px !== bg) return px;
    } else if (sealDarkHit(x, y, 190, 250, 280)) {
      return sealDarkPixel(x, y, 190, 250, 280, bg);
    }
  }

  // Soft vertical separator
  if (x >= 360 && x < 363) return [0xc9, 0x83, 0x40, 80];

  // Right zone: "GOVDAO" wordmark in softGold
  if (isGlyphPixel(x, y, WORD, WORD_START_X, WORD_START_Y, TEXT_SCALE)) {
    return SOFT_GOLD;
  }

  return bg;
});
