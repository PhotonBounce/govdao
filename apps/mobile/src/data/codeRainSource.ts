// Deterministic "code rain" background generator — pure data, no RN imports.
// Produces columns of governance-flavoured glyph streams that the CodeRainBackground
// component animates. Determinism (seeded) keeps it unit-testable.
import { seededRandom } from "../utils/animations";

const HEX = "0123456789ABCDEF".split("");
const TOKENS = ["0x", "VOTE", "DAO", "QUORUM", "PROPOSE", "TIMELOCK", "GUARDIAN", "STAKE", "YEA", "NAY", "GOV"];

export interface RainColumn {
  id: number;
  /** Horizontal position as a fraction of screen width, 0–1. */
  xFraction: number;
  /** Glyphs stacked top→bottom in this column. */
  glyphs: string[];
  /** Fall duration in ms (lower = faster). */
  durationMs: number;
  /** Start delay in ms so columns desync. */
  delayMs: number;
  /** Base opacity 0–1. */
  opacity: number;
}

export interface RainOptions {
  columns?: number;
  rows?: number;
  seed?: number;
}

export function buildRainColumns(options: RainOptions = {}): RainColumn[] {
  const columns = options.columns ?? 12;
  const rows = options.rows ?? 18;
  const rand = seededRandom(options.seed ?? 1337);
  const out: RainColumn[] = [];

  for (let c = 0; c < columns; c += 1) {
    const glyphs: string[] = [];
    for (let r = 0; r < rows; r += 1) {
      // Occasionally drop a whole governance token, otherwise a hex glyph.
      if (rand() < 0.12) {
        glyphs.push(TOKENS[Math.floor(rand() * TOKENS.length)]);
      } else {
        glyphs.push(HEX[Math.floor(rand() * HEX.length)]);
      }
    }
    out.push({
      id: c,
      xFraction: columns === 1 ? 0 : c / (columns - 1),
      glyphs,
      durationMs: 6000 + Math.floor(rand() * 9000),
      delayMs: Math.floor(rand() * 5000),
      opacity: 0.05 + rand() * 0.13,
    });
  }
  return out;
}

/** Cycle a glyph deterministically for the flicker effect at a given tick. */
export function flickerGlyph(column: RainColumn, row: number, tick: number): string {
  const base = column.glyphs[row % column.glyphs.length];
  if (base.length > 1) return base; // don't flicker word tokens
  return HEX[(column.id + row + tick) % HEX.length];
}
