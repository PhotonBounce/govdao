// Generates the Android/store image assets (app icon, adaptive-icon
// foreground, splash) from the brand palette without any image library,
// so the assets are reproducible from source instead of binary-only.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const SAND = [0xf3, 0xef, 0xe3, 255];
const GRAPHITE = [0x1f, 0x1b, 0x18, 255];
const BRONZE = [0x8e, 0x5c, 0x32, 255];
const PAPER = [0xfb, 0xf8, 0xef, 255];
const TRANSPARENT = [0, 0, 0, 0];

const crcTable = new Int32Array(256).map((_, n) => {
	let c = n;
	for (let k = 0; k < 8; k += 1) {
		c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	}
	return c;
});

function crc32(bytes) {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
	}
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
		raw[rowStart] = 0; // no filter
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
	ihdr[8] = 8; // bit depth
	ihdr[9] = 6; // RGBA
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

// Brand mark: a governance "seal" — graphite disc, bronze ring, paper ballot slot.
function sealPixel(x, y, cx, cy, scale, background) {
	const dx = x - cx;
	const dy = y - cy;
	const distance = Math.sqrt(dx * dx + dy * dy);

	if (distance > 0.46 * scale) {
		return background;
	}
	if (distance > 0.40 * scale) {
		return BRONZE;
	}
	// Ballot slot across the disc.
	if (Math.abs(dy + 0.06 * scale) < 0.035 * scale && Math.abs(dx) < 0.22 * scale) {
		return PAPER;
	}
	// Ballot edge dropping into the slot.
	if (dy < -0.095 * scale && dy > -0.30 * scale && Math.abs(dx) < 0.13 * scale) {
		return BRONZE;
	}
	return GRAPHITE;
}

const assetsDir = path.resolve(process.cwd(), "assets");

writePng(path.join(assetsDir, "icon.png"), 1024, 1024, (x, y) => sealPixel(x, y, 512, 512, 1024, SAND));

writePng(path.join(assetsDir, "adaptive-icon.png"), 1024, 1024, (x, y) => {
	// Keep the mark inside the adaptive-icon safe zone (~66% of the canvas).
	return sealPixel(x, y, 512, 512, 660, TRANSPARENT);
});

writePng(path.join(assetsDir, "splash.png"), 1080, 1920, (x, y) => sealPixel(x, y, 540, 960, 560, SAND));
