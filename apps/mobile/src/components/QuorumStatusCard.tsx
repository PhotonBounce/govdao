import { StyleSheet, Text, View } from "react-native";
import { ModulePill } from "./ModulePill";
import { SectionCard } from "./SectionCard";
import { computeQuorum, quorumLabel, QuorumStatus } from "../data/quorumSource";
import { loadVoteTally } from "../data/delegateSource";
import { AppManifest } from "../types";
import { palette } from "../theme";

interface QuorumStatusCardProps {
  manifest: AppManifest;
  proposalIds: string[];
  totalMembers: number;
}

export function QuorumStatusCard({ manifest, proposalIds, totalMembers }: QuorumStatusCardProps) {
  const statuses: QuorumStatus[] = proposalIds.flatMap((id) => {
    const tally = loadVoteTally(manifest, id);
    return tally ? [computeQuorum(tally, totalMembers)] : [];
  });

  if (statuses.length === 0) return null;

  const atQuorum = statuses.filter((s) => s.reached).length;
  const belowQuorum = statuses.length - atQuorum;

  return (
    <SectionCard
      eyebrow="Quorum Status"
      title="Participation Summary"
      subtitle={`${statuses.length} active proposal${statuses.length !== 1 ? "s" : ""} tracked against ${totalMembers} registered members.`}
      infoKey="quorum"
    >
      <View style={styles.summaryRow}>
        <ModulePill label={`${atQuorum} AT QUORUM`} tone="pine" />
        {belowQuorum > 0 ? <ModulePill label={`${belowQuorum} PENDING`} tone="bronze" /> : null}
      </View>
      {statuses.map((status) => (
        <View key={status.proposalId} style={styles.statusRow}>
          <Text style={styles.statusId}>{status.proposalId}</Text>
          <View style={styles.statusRight}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(status.pct, 100)}%` as unknown as number,
                    backgroundColor: status.reached ? palette.pine : palette.bronze
                  }
                ]}
              />
            </View>
            <Text style={styles.statusLabel}>{quorumLabel(status)}</Text>
          </View>
        </View>
      ))}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14
  },
  statusRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(93, 81, 72, 0.12)"
  },
  statusId: {
    color: palette.bronze,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6
  },
  statusRight: {
    gap: 4
  },
  barTrack: {
    height: 6,
    backgroundColor: "rgba(93, 81, 72, 0.12)",
    borderRadius: 3,
    overflow: "hidden"
  },
  barFill: {
    height: 6,
    borderRadius: 3
  },
  statusLabel: {
    color: palette.inkSoft,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4
  }
});
