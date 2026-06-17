import { StyleSheet, Text, View } from "react-native";
import { SectionCard } from "./SectionCard";
import { DelegatePowerMap, tierColor } from "../data/delegatePowerMapSource";
import { darkPalette } from "../theme";

interface Props {
  map: DelegatePowerMap;
}

export function DelegatePowerMapCard({ map }: Props) {
  const sorted = [...map.nodes].sort((a, b) => b.voteWeight - a.voteWeight).slice(0, 8);
  const maxWeight = sorted[0]?.voteWeight ?? 1;

  return (
    <SectionCard tone="glass" eyebrow="Delegation" title="Vote Power Map" infoKey="delegate-power-map">
      <View style={styles.legend}>
        {(["whale", "active", "delegate", "dormant"] as const).map((tier) => (
          <View key={tier} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: tierColor(tier) }]} />
            <Text style={styles.legendLabel}>{tier.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {sorted.map((node) => {
          const size = Math.max(24, Math.round((node.voteWeight / maxWeight) * 72));
          return (
            <View key={node.address} style={styles.nodeWrap}>
              <View style={[styles.bubble, { width: size, height: size, borderRadius: size / 2, backgroundColor: tierColor(node.tier) }]}>
                <Text style={[styles.bubbleText, { fontSize: Math.max(8, size / 6) }]}>{node.voteWeight}</Text>
              </View>
              <Text style={styles.nodeLabel} numberOfLines={1}>{node.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Top holder: <Text style={styles.footerBold}>{map.topHolder}</Text></Text>
        <Text style={styles.footerText}>{map.totalDelegated} active delegations</Text>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: "rgba(224,219,208,0.55)", fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "flex-start", marginBottom: 14 },
  nodeWrap: { alignItems: "center", gap: 4, maxWidth: 72 },
  bubble: { justifyContent: "center", alignItems: "center", opacity: 0.92 },
  bubbleText: { color: "#fff", fontWeight: "800" },
  nodeLabel: { color: "rgba(224,219,208,0.7)", fontSize: 9, textAlign: "center" },
  footer: { flexDirection: "row", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  footerText: { color: "rgba(224,219,208,0.55)", fontSize: 11 },
  footerBold: { color: darkPalette.softGold, fontWeight: "700" },
});
