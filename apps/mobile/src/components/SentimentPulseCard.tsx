import { StyleSheet, Text, View } from "react-native";
import { SectionCard } from "./SectionCard";
import { ProposalSentiment, sentimentColor, sentimentLabel } from "../data/sentimentPulseSource";
import { darkPalette } from "../theme";

interface Props {
  sentiments: ProposalSentiment[];
}

export function SentimentPulseCard({ sentiments }: Props) {
  return (
    <SectionCard tone="glass" eyebrow="Community Pulse" title="Proposal Sentiment" infoKey="sentiment-pulse">
      {sentiments.map((s, idx) => {
        const color = sentimentColor(s.sentimentScore);
        const pct = ((s.sentimentScore + 100) / 200) * 100;
        return (
          <View key={s.proposalId} style={[styles.row, idx < sentiments.length - 1 && styles.rowBorder]}>
            <View style={styles.rowHeader}>
              <Text style={styles.proposalId}>Proposal {idx + 1}</Text>
              <Text style={[styles.sentiment, { color }]}>{sentimentLabel(s.sentimentScore)}</Text>
            </View>

            <View style={styles.reactionRow}>
              {s.reactions.filter((r) => r.count > 0).sort((a, b) => b.count - a.count).map((r) => (
                <View key={r.type} style={styles.reaction}>
                  <Text style={styles.emoji}>{r.emoji}</Text>
                  <Text style={styles.reactionCount}>{r.count}</Text>
                </View>
              ))}
            </View>

            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: `${pct}%`, backgroundColor: color }]} />
              <View style={styles.midLine} />
            </View>

            <Text style={styles.total}>{s.totalReactions} reactions · score {s.sentimentScore > 0 ? "+" : ""}{s.sentimentScore}</Text>
          </View>
        );
      })}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  proposalId: { color: darkPalette.dimWhite, fontSize: 13, fontWeight: "700" },
  sentiment: { fontSize: 12, fontWeight: "600" },
  reactionRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
  reaction: { flexDirection: "row", alignItems: "center", gap: 4 },
  emoji: { fontSize: 18 },
  reactionCount: { color: "rgba(224,219,208,0.7)", fontSize: 12, fontWeight: "600" },
  meterTrack: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 5, position: "relative" },
  meterFill: { height: "100%", borderRadius: 4, opacity: 0.8 },
  midLine: { position: "absolute", left: "50%", top: 0, width: 1, height: "100%", backgroundColor: "rgba(255,255,255,0.25)" },
  total: { color: "rgba(224,219,208,0.4)", fontSize: 11 },
});
