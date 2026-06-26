import { Platform } from "react-native";

// Brand typography — an elegant serif for headings (matches the G-coin logo
// wordmark) and a monospace face for on-chain data (addresses, hashes).
export const fonts = {
  serif: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }) as string,
  mono: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) as string
};

// Brand accent introduced by the G-coin logo — teal pairs with the gold.
export const brand = {
  teal: "#2ec4c6",
  tealDeep: "#18969a",
  gold: "#ce922e",
  goldHi: "#eeb856"
};

export const palette = {
  sand: "#f3efe3",
  paper: "#fbf8ef",
  graphite: "#1f1b18",
  bronze: "#8e5c32",
  clay: "#c98648",
  moss: "#557160",
  pine: "#30473a",
  rose: "#a04d4a",
  inkSoft: "#5d5148",
  line: "#d9cdb8",
  white: "#ffffff"
};

export const darkPalette = {
  obsidian: "#0d0d1a",
  glowBronze: "#c98340",
  softGold: "#e8c87a",
  dimWhite: "#e0dbd0",
  mutedLine: "rgba(255,255,255,0.08)",
  glassCard: "rgba(255,255,255,0.05)",
  glassBorder: "rgba(201,131,64,0.22)",
  activeGlow: "rgba(201,131,64,0.18)"
};

export const radii = {
  card: 22,
  pill: 999,
  panel: 30
};