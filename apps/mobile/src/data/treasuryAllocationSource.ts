export interface AssetHolding {
  symbol: string;
  label: string;
  amount: number; // token units
  valueUsd: number; // current USD value
}

export interface AllocationSlice {
  symbol: string;
  label: string;
  amount: number;
  valueUsd: number;
  pct: number; // 0–100 share of total value
  tone: "pine" | "bronze" | "rose" | "gold";
}

export interface TreasuryAllocation {
  totalUsd: number;
  slices: AllocationSlice[];
  transport: "fixture" | "remote";
}

const TONES: AllocationSlice["tone"][] = ["gold", "pine", "bronze", "rose"];

/** Compute percentage allocation across treasury assets, sorted by value desc. */
export function computeAllocation(holdings: AssetHolding[]): AllocationSlice[] {
  const total = holdings.reduce((sum, h) => sum + Math.max(0, h.valueUsd), 0);
  const sorted = [...holdings].sort((a, b) => b.valueUsd - a.valueUsd);
  return sorted.map((h, i) => ({
    symbol: h.symbol,
    label: h.label,
    amount: h.amount,
    valueUsd: h.valueUsd,
    pct: total > 0 ? Math.round((h.valueUsd / total) * 1000) / 10 : 0,
    tone: TONES[i % TONES.length],
  }));
}

export const FIXTURE_HOLDINGS: AssetHolding[] = [
  { symbol: "ETH", label: "Ether", amount: 184.2, valueUsd: 552600 },
  { symbol: "USDC", label: "USD Coin", amount: 220000, valueUsd: 220000 },
  { symbol: "GOV", label: "Governance Token", amount: 1250000, valueUsd: 87500 },
  { symbol: "WBTC", label: "Wrapped BTC", amount: 1.4, valueUsd: 95200 },
];

export function loadTreasuryAllocation(): TreasuryAllocation {
  const slices = computeAllocation(FIXTURE_HOLDINGS);
  return {
    totalUsd: slices.reduce((sum, s) => sum + s.valueUsd, 0),
    slices,
    transport: "fixture",
  };
}

export function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}
