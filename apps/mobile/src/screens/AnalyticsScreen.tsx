import { StyleSheet, Text, View } from "react-native";
import { SectionCard } from "../components/SectionCard";
import { ModulePill } from "../components/ModulePill";
import { GovernanceAnalytics } from "../data/analyticsSource";
import { darkPalette, radii } from "../theme";

interface AnalyticsScreenProps {
  analytics: GovernanceAnalytics;
}

function MetricCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "bronze" | "pine" | "rose" }) {
  return (
    <View style={styles.metricCard}>
      <ModulePill label={tone === "pine" ? "GOOD" : tone === "rose" ? "LOW" : "AVG"} tone={tone} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricSub}>{sub}</Text>
    </View>
  );
}

function SparkBar({ rate, passed }: { rate: number; passed: boolean }) {
  return (
    <View style={styles.sparkRow}>
      <View style={[styles.sparkFill, { width: `${rate}%` as `${number}%`, backgroundColor: passed ? darkPalette.glowBronze : darkPalette.mutedLine }]} />
      <Text style={styles.sparkLabel}>{rate}%</Text>
    </View>
  );
}

export function AnalyticsScreen({ analytics }: AnalyticsScreenProps) {
  return (
    <>
      <SectionCard tone="glass" eyebrow="Governance Health" title="Analytics" infoKey="analytics">
        <View style={styles.metricsGrid}>
          <MetricCard
            label="Avg Participation"
            value={`${analytics.avgParticipation}%`}
            sub={`across ${analytics.totalProposals} proposals`}
            tone={analytics.avgParticipation >= 70 ? "pine" : analytics.avgParticipation >= 50 ? "bronze" : "rose"}
          />
          <MetricCard
            label="Pass Rate"
            value={`${analytics.passRate}%`}
            sub={`${analytics.participationHistory.filter((p) => p.passed).length} of ${analytics.totalProposals} passed`}
            tone={analytics.passRate >= 60 ? "pine" : "bronze"}
          />
          <MetricCard
            label="Total Votes Cast"
            value={String(analytics.totalVotes)}
            sub="across all proposals"
            tone="bronze"
          />
          <MetricCard
            label="Avg Quorum Distance"
            value={`${analytics.avgQuorumDistance}%`}
            sub="from 50% threshold"
            tone={analytics.avgQuorumDistance >= 20 ? "pine" : "rose"}
          />
        </View>
      </SectionCard>

      <SectionCard tone="glass" eyebrow="Participation Trend" title="Last 6 Proposals" infoKey="analytics">
        {analytics.participationHistory.map((p) => (
          <View key={p.proposalId} style={styles.sparkItem}>
            <View style={styles.sparkHeader}>
              <Text style={styles.sparkId}>{p.proposalId}</Text>
              <Text style={styles.sparkTitle} numberOfLines={1}>{p.title}</Text>
              <ModulePill label={p.passed ? "PASSED" : "FAILED"} tone={p.passed ? "pine" : "rose"} />
            </View>
            <SparkBar rate={p.participationRate} passed={p.passed} />
          </View>
        ))}
      </SectionCard>

      <SectionCard tone="glass" eyebrow="Top Contributors" title="Delegate Performance" infoKey="analytics">
        {analytics.topDelegates.map((d) => (
          <View key={d.id} style={styles.delegateRow}>
            <View style={styles.delegateInfo}>
              <Text style={styles.delegateName}>{d.label}</Text>
              <Text style={styles.delegateRole}>{d.role} · {d.id}</Text>
            </View>
            <View style={styles.delegateStats}>
              <Text style={styles.delegateStat}>{d.votesCount} votes</Text>
              <Text style={[styles.delegateStat, { color: darkPalette.softGold }]}>{d.participationRate}%</Text>
            </View>
          </View>
        ))}
        <Text style={styles.transportBadge}>
          {analytics.transport === "fixture" ? "· fixture data" : "· live on-chain"}
        </Text>
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4
  },
  metricCard: {
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: darkPalette.mutedLine,
    padding: 14,
    gap: 6
  },
  metricValue: {
    color: darkPalette.dimWhite,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5
  },
  metricLabel: {
    color: darkPalette.softGold,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  metricSub: {
    color: "rgba(224,219,208,0.5)",
    fontSize: 11
  },
  sparkItem: {
    marginBottom: 14
  },
  sparkHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6
  },
  sparkId: {
    color: darkPalette.glowBronze,
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"]
  },
  sparkTitle: {
    color: darkPalette.dimWhite,
    fontSize: 12,
    flex: 1
  },
  sparkRow: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center"
  },
  sparkFill: {
    height: "100%",
    borderRadius: 4
  },
  sparkLabel: {
    position: "absolute",
    right: 6,
    color: darkPalette.dimWhite,
    fontSize: 9,
    fontWeight: "600"
  },
  delegateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: darkPalette.mutedLine
  },
  delegateInfo: {
    flex: 1,
    gap: 2
  },
  delegateName: {
    color: darkPalette.dimWhite,
    fontSize: 14,
    fontWeight: "600"
  },
  delegateRole: {
    color: "rgba(224,219,208,0.5)",
    fontSize: 12
  },
  delegateStats: {
    alignItems: "flex-end",
    gap: 2
  },
  delegateStat: {
    color: darkPalette.dimWhite,
    fontSize: 13,
    fontWeight: "600"
  },
  transportBadge: {
    color: "rgba(224,219,208,0.35)",
    fontSize: 11,
    marginTop: 8,
    textAlign: "right"
  }
});
