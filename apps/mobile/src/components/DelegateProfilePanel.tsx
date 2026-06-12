import { StyleSheet, Text, View } from "react-native";
import { DelegateProfile, choiceTone, formatParticipationRate } from "../data/delegateSource";
import { ModulePill } from "./ModulePill";
import { SignalRow } from "./SignalRow";
import { palette } from "../theme";

interface DelegateProfilePanelProps {
  profile: DelegateProfile;
}

function formatVotedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DelegateProfilePanel({ profile }: DelegateProfilePanelProps) {
  const participationTone = profile.participationRate >= 80 ? "good" : profile.participationRate >= 50 ? "warning" : "warning";

  return (
    <>
      <SignalRow
        label="Participation rate"
        value={formatParticipationRate(profile.participationRate)}
        tone={participationTone}
      />
      <SignalRow
        label="Address"
        value={`${profile.address.slice(0, 8)}…${profile.address.slice(-6)}`}
        tone="neutral"
      />

      {profile.recentVotes.length > 0 ? (
        <>
          <Text style={styles.historyHeading}>Recent Votes</Text>
          {profile.recentVotes.map((vote) => (
            <View key={vote.proposalId} style={styles.voteRow}>
              <View style={styles.voteTopRow}>
                <Text style={styles.proposalId}>{vote.proposalId}</Text>
                <ModulePill label={vote.choice.toUpperCase()} tone={choiceTone(vote.choice)} />
              </View>
              <Text style={styles.proposalTitle}>{vote.proposalTitle}</Text>
              <View style={styles.voteMetaRow}>
                <Text style={styles.votedAt}>{formatVotedAt(vote.votedAt)}</Text>
                {vote.anchorHash ? (
                  <ModulePill label="ANCHORED" tone="pine" />
                ) : null}
              </View>
            </View>
          ))}
        </>
      ) : (
        <Text style={styles.emptyLine}>No voting history available for this delegate yet.</Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  historyHeading: {
    color: palette.inkSoft,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8
  },
  voteRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(93, 81, 72, 0.10)"
  },
  voteTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  proposalId: {
    color: palette.bronze,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  proposalTitle: {
    color: palette.graphite,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4
  },
  voteMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  votedAt: {
    color: palette.inkSoft,
    fontSize: 12
  },
  emptyLine: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  }
});
