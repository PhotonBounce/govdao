import { StyleSheet, Text, View } from "react-native";
import { SectionCard } from "./SectionCard";
import { ProposalRisk, riskColor } from "../data/proposalRiskSource";
import { darkPalette } from "../theme";

interface Props {
  risk: ProposalRisk;
}

export function ProposalRiskCard({ risk }: Props) {
  const color = riskColor(risk.level);

  return (
    <SectionCard tone="glass" eyebrow="Risk Analyzer" title="Proposal Risk Score" infoKey="proposal-risk">
      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color }]}>{risk.score}</Text>
        <View style={styles.badgeWrap}>
          <View style={[styles.badge, { borderColor: color }]}>
            <Text style={[styles.badgeText, { color }]}>{risk.level}</Text>
          </View>
          <Text style={styles.levelLabel}>{risk.label}</Text>
        </View>
      </View>

      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${risk.score}%`, backgroundColor: color }]} />
      </View>

      <View style={styles.factors}>
        {risk.factors.map((f) => (
          <View key={f.id} style={styles.factorRow}>
            <View style={styles.factorLeft}>
              <Text style={styles.factorLabel}>{f.label}</Text>
              <Text style={styles.factorDetail}>{f.detail}</Text>
            </View>
            <View style={styles.factorBarTrack}>
              <View style={[styles.factorBarFill, { width: `${f.score}%`, backgroundColor: riskColor(f.score >= 75 ? "CRITICAL" : f.score >= 50 ? "HIGH" : f.score >= 25 ? "MEDIUM" : "LOW") }]} />
            </View>
            <Text style={styles.factorValue}>{f.score}</Text>
          </View>
        ))}
      </View>

      <View style={styles.rec}>
        <Text style={styles.recLabel}>↳ </Text>
        <Text style={styles.recText}>{risk.recommendation}</Text>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  score: { fontSize: 56, fontWeight: "800", letterSpacing: -1 },
  badgeWrap: { alignItems: "flex-end", gap: 6 },
  badge: { borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  levelLabel: { color: "rgba(224,219,208,0.6)", fontSize: 12 },
  meterTrack: { height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 16 },
  meterFill: { height: "100%", borderRadius: 5 },
  factors: { gap: 9, marginBottom: 14 },
  factorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  factorLeft: { width: 120 },
  factorLabel: { color: "rgba(224,219,208,0.8)", fontSize: 11, fontWeight: "600" },
  factorDetail: { color: "rgba(224,219,208,0.4)", fontSize: 10 },
  factorBarTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  factorBarFill: { height: "100%", borderRadius: 3 },
  factorValue: { color: darkPalette.dimWhite, fontSize: 11, fontWeight: "600", width: 24, textAlign: "right", fontVariant: ["tabular-nums"] },
  rec: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 10 },
  recLabel: { color: darkPalette.glowBronze, fontSize: 12, fontWeight: "700" },
  recText: { color: "rgba(224,219,208,0.7)", fontSize: 12, flex: 1 },
});
