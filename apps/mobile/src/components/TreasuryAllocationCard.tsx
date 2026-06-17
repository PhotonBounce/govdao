import { StyleSheet, Text, View } from "react-native";
import { SectionCard } from "./SectionCard";
import { TreasuryAllocation, formatUsd } from "../data/treasuryAllocationSource";
import { darkPalette } from "../theme";

interface TreasuryAllocationCardProps {
  allocation: TreasuryAllocation;
}

const TONE_COLORS: Record<string, string> = {
  gold: "#e8c87a",
  pine: "#5c9b73",
  bronze: "#c98340",
  rose: "#c06a64",
};

export function TreasuryAllocationCard({ allocation }: TreasuryAllocationCardProps) {
  return (
    <SectionCard tone="glass" eyebrow="Portfolio" title="Treasury Allocation" infoKey="treasury">
      <Text style={styles.total}>{formatUsd(allocation.totalUsd)}</Text>
      <Text style={styles.totalSub}>total across {allocation.slices.length} assets</Text>

      <View style={styles.stackedBar}>
        {allocation.slices.map((s) => (
          <View key={s.symbol} style={{ width: `${s.pct}%` as `${number}%`, backgroundColor: TONE_COLORS[s.tone] }} />
        ))}
      </View>

      <View style={styles.rows}>
        {allocation.slices.map((s) => (
          <View key={s.symbol} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: TONE_COLORS[s.tone] }]} />
            <Text style={styles.symbol}>{s.symbol}</Text>
            <Text style={styles.label} numberOfLines={1}>{s.label}</Text>
            <Text style={styles.value}>{formatUsd(s.valueUsd)}</Text>
            <Text style={styles.pct}>{s.pct}%</Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  total: { color: darkPalette.dimWhite, fontSize: 34, fontWeight: "800", letterSpacing: -0.5 },
  totalSub: { color: "rgba(224,219,208,0.5)", fontSize: 12, marginBottom: 14 },
  stackedBar: { flexDirection: "row", height: 14, borderRadius: 7, overflow: "hidden", marginBottom: 16, backgroundColor: "rgba(255,255,255,0.06)" },
  rows: { gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  symbol: { color: darkPalette.dimWhite, fontSize: 13, fontWeight: "700", width: 52 },
  label: { color: "rgba(224,219,208,0.55)", fontSize: 12, flex: 1 },
  value: { color: darkPalette.dimWhite, fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] },
  pct: { color: darkPalette.softGold, fontSize: 13, fontWeight: "700", width: 48, textAlign: "right", fontVariant: ["tabular-nums"] },
});
