import { Pressable, StyleSheet, Text, View } from "react-native";
import { ModulePill } from "../components/ModulePill";
import { SectionCard } from "../components/SectionCard";
import { MotionItem, ProposalItem } from "../data/mobileDataSource";
import { palette } from "../theme";

interface ProposalsScreenProps {
  proposals: ProposalItem[];
  motions: MotionItem[];
  offchainEnabled: boolean;
  onSelectProposal: (proposal: ProposalItem) => void;
  onSelectMotion: (motion: MotionItem) => void;
}

export function ProposalsScreen({ proposals, motions, offchainEnabled, onSelectProposal, onSelectMotion }: ProposalsScreenProps) {
  return (
    <>
      <SectionCard
        eyebrow="Proposal Feed"
        title="Live Governance Snapshot"
        subtitle="A release candidate should show both treasury-grade proposals and hybrid motions in one place."
      >
        {proposals.length === 0 ? <Text style={styles.emptyLine}>No proposals are available from the active feed yet.</Text> : null}
        {proposals.map((proposal) => (
          <Pressable key={proposal.id} style={styles.feedItem} onPress={() => onSelectProposal(proposal)}>
            <View style={styles.feedTopRow}>
              <Text style={styles.feedId}>{proposal.id}</Text>
              <ModulePill label={proposal.state} tone={proposal.state === "Queued" ? "pine" : "bronze"} />
            </View>
            <Text style={styles.feedTitle}>{proposal.title}</Text>
            <Text style={styles.feedSummary}>{proposal.summary}</Text>
            <Text style={styles.feedMeta}>{proposal.source} workflow • ETA {proposal.eta}</Text>
          </Pressable>
        ))}
      </SectionCard>

      {offchainEnabled ? (
        <SectionCard
          eyebrow="Off-Chain DAO"
          title="Motions And Review Queue"
          subtitle="These flows cover organizational work that benefits from faster off-chain coordination with optional anchoring back into governance records."
        >
          {motions.length === 0 ? <Text style={styles.emptyLine}>No off-chain motions are available from the active provider.</Text> : null}
          {motions.map((motion) => (
            <Pressable key={motion.id} style={styles.feedItem} onPress={() => onSelectMotion(motion)}>
              <View style={styles.feedTopRow}>
                <Text style={styles.feedId}>{motion.id}</Text>
                <ModulePill label={motion.stage} tone="rose" />
              </View>
              <Text style={styles.feedTitle}>{motion.title}</Text>
              <Text style={styles.feedSummary}>{motion.summary}</Text>
              <Text style={styles.feedMeta}>Auth {motion.auth}</Text>
            </Pressable>
          ))}
        </SectionCard>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  feedItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(93, 81, 72, 0.12)"
  },
  feedTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  feedId: {
    color: palette.bronze,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  feedTitle: {
    color: palette.graphite,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6
  },
  feedSummary: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6
  },
  feedMeta: {
    color: palette.moss,
    fontSize: 13,
    fontWeight: "600"
  },
  emptyLine: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8
  }
});