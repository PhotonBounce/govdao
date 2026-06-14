// Pure animation helpers — no React/RN imports, so they are unit-testable in plain Node.

export const BG_CYCLE = ["#0d0d1a", "#0a1a14", "#1a0d0d", "#0d1214", "#0d0d1a"] as const;

export type PressIntensity = "subtle" | "normal" | "strong";

export interface PressSpringConfig {
  pressedScale: number;
  restScale: number;
  tension: number;
  friction: number;
}

/** Spring config for a press-to-shrink button interaction. */
export function pressSpringConfig(intensity: PressIntensity = "normal"): PressSpringConfig {
  const pressedScale = intensity === "subtle" ? 0.97 : intensity === "strong" ? 0.9 : 0.94;
  const friction = intensity === "strong" ? 7 : intensity === "subtle" ? 14 : 11;
  return { pressedScale, restScale: 1, tension: 320, friction };
}

/** Staggered entrance delay (ms) for the Nth item, clamped so long lists don't drag. */
export function staggerDelay(index: number, step = 80, max = 560): number {
  if (index <= 0) return 0;
  return Math.min(index * step, max);
}

/** Linear interpolation between two numbers, t clamped to [0,1]. */
export function lerp(from: number, to: number, t: number): number {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  return from + (to - from) * clamped;
}

/** Parallax translate for a layer at a given depth (0 = static, 1 = moves with scroll). */
export function parallaxTranslate(scroll: number, depth: number, maxShift = 140): number {
  const shift = scroll * depth;
  const limit = maxShift * depth;
  return Math.max(-limit, Math.min(limit, shift));
}

/** Deterministic pseudo-random in [0,1) from a 32-bit seed (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
