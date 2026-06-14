/**
 * QA gate: validates the pure animation + code-rain logic that drives the
 * eye-candy layer. Components themselves are RN and can't render headlessly,
 * but their data/maths are isolated here and fully testable.
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", esModuleInterop: true },
});

const root = path.resolve(process.cwd(), "src");
const anim = require(path.join(root, "utils", "animations.ts"));
const rain = require(path.join(root, "data", "codeRainSource.ts"));

let passed = 0, failed = 0;
function assert(label, condition, detail = "") {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

console.log("\nEyeCandy: press spring config");
for (const intensity of ["subtle", "normal", "strong"]) {
  const c = anim.pressSpringConfig(intensity);
  assert(`${intensity} pressedScale in (0,1)`, c.pressedScale > 0 && c.pressedScale < 1, `got ${c.pressedScale}`);
  assert(`${intensity} restScale is 1`, c.restScale === 1);
  assert(`${intensity} tension/friction positive`, c.tension > 0 && c.friction > 0);
}
assert("strong shrinks more than subtle", anim.pressSpringConfig("strong").pressedScale < anim.pressSpringConfig("subtle").pressedScale);

console.log("\nEyeCandy: stagger + lerp + parallax");
assert("staggerDelay(0) is 0", anim.staggerDelay(0) === 0);
assert("staggerDelay grows then clamps", anim.staggerDelay(3) === 240 && anim.staggerDelay(100) === 560, `got ${anim.staggerDelay(3)}, ${anim.staggerDelay(100)}`);
assert("lerp midpoint", anim.lerp(0, 10, 0.5) === 5);
assert("lerp clamps t", anim.lerp(0, 10, 2) === 10 && anim.lerp(0, 10, -1) === 0);
assert("parallaxTranslate clamps to depth limit", anim.parallaxTranslate(10000, 0.5, 140) === 70);
assert("parallaxTranslate static at depth 0", anim.parallaxTranslate(500, 0) === 0);

console.log("\nEyeCandy: seeded RNG determinism");
const a = anim.seededRandom(42);
const b = anim.seededRandom(42);
const seqA = [a(), a(), a()];
const seqB = [b(), b(), b()];
assert("same seed → same sequence", JSON.stringify(seqA) === JSON.stringify(seqB));
assert("values in [0,1)", seqA.every((v) => v >= 0 && v < 1));
assert("different seeds differ", anim.seededRandom(1)() !== anim.seededRandom(2)());

console.log("\nEyeCandy: code rain columns");
const cols = rain.buildRainColumns({ columns: 12, rows: 18, seed: 1337 });
assert("builds 12 columns", cols.length === 12, `got ${cols.length}`);
assert("each column has 18 glyphs", cols.every((c) => c.glyphs.length === 18));
assert("xFraction spans 0→1", cols[0].xFraction === 0 && Math.abs(cols[11].xFraction - 1) < 1e-9);
assert("durations positive", cols.every((c) => c.durationMs > 0));
assert("opacity is subtle (<0.2)", cols.every((c) => c.opacity > 0 && c.opacity < 0.2));
const colsAgain = rain.buildRainColumns({ columns: 12, rows: 18, seed: 1337 });
assert("rain is deterministic per seed", JSON.stringify(cols) === JSON.stringify(colsAgain));
assert("single column → xFraction 0", rain.buildRainColumns({ columns: 1 })[0].xFraction === 0);

console.log("\nEyeCandy: flicker glyph");
const fg = rain.flickerGlyph(cols[0], 0, 5);
assert("flickerGlyph returns a string", typeof fg === "string" && fg.length >= 1);

console.log(`\ncheck-eye-candy: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
