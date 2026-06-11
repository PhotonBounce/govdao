import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ModulePill } from "../components/ModulePill";
import { SectionCard } from "../components/SectionCard";
import { MotionItem, ProposalItem } from "../data/mobileDataSource";
import { palette, radii } from "../theme";

const PROPOSAL_FILTER_STATES = ["All", "Voting", "Queued", "Succeeded", "Defeated"] as const;
type ProposalFilterState = (typeof PROPOSAL_FILTER_STATES)[number];

interface ProposalsScreenProps {
  proposals: ProposalItem[];
  motions: MotionItem[];
  offchainEnabled: boolean;
  proposalCreationEnabled: boolean;
  onSelectProposal: (proposal: ProposalItem) => void;
  onSelectMotion: (motion: MotionItem) => void;
  onCreateProposal: () => void;
}

function matchesSearch(query: string, ...fields: string[]): boolean {
  if (!query.trim()) {
    return true;
  }

  const lower = query.toLowerCase();
  return fields.some((field) => field.toLowerCase().includes(lower));
}

export function ProposalsScreen({
  proposals,
  motions,
  offchainEnabled,
  proposalCreationEnabled,
  onSelectProposal,
  onSelectMotion,
  onCreateProposal
}: ProposalsScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<ProposalFilterState>("All");

  const filteredProposals = proposals.filter((proposal) => {
    const stateMatch = stateFilter === "All" || proposal.state === stateFilter;
    const searchMatch = matchesSearch(searchQuery, proposal.id, proposal.title, proposal.summary, proposal.owner);
    return stateMatch && searchMatch;
  });

  const filteredMotions = motions.filter((motion) =>
    matchesSearch(searchQuery, motion.id, motion.title, motion.summary, motion.owner)
  );

  return (
    <>
      <SectionCard
        eyebrow="Search & Filter"
        title="Narrow The Feed"
        subtitle="Search by title, ID, or owner. Filter proposals by on-chain state."
      >
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search proposals and motions…"
          placeholderTextColor={palette.inkSoft}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        <View style={styles.filterRow}>
          {PROPOSAL_FILTER_STATES.map((label) => (
            <Pressable
              key={label}
              style={[styles.filterPill, stateFilter === label && styles.filterPillActive]}
              onPress={() => setStateFilter(label)}
            >
              <Text style={[styles.filterPillText, stateFilter === label && styles.filterPillTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        eyebrow="Proposal Feed"
        title="Live Governance Snapshot"
        subtitle="A release candidate should show both treasury-grade proposals and hybrid motions in one place."
      >
        {proposalCreationEnabled ? (
          <Pressable style={styles.createButton} onPress={onCreateProposal}>
            <Text style={styles.createButtonText}>+ New Proposal</Text>
          </Pressable>
        ) : null}
        {filteredProposals.length === 0 ? (
          <Text style={styles.emptyLine}>
            {searchQuery || stateFilter !== "All"
              ? "No proposals match the current search or filter."
              : "No proposals are available from the active feed yet."}
          </Text>
        ) : null}
        {filteredProposals.map((proposal) => (
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
          {filteredMotions.length === 0 ? (
            <Text style={styles.emptyLine}>
              {searchQuery
                ? "No motions match the current search."
                : "No off-chain motions are available from the active provider."}
            </Text>
          ) : null}
          {filteredMotions.map((motion) => (
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
  searchInput: {
    height: 40,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "rgba(142, 92, 50, 0.22)",
    backgroundColor: "rgba(251, 248, 239, 0.7)",
    paddingHorizontal: 12,
    color: palette.graphite,
    fontSize: 14,
    marginBottom: 10
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(142, 92, 50, 0.22)",
    backgroundColor: "rgba(217, 205, 184, 0.18)"
  },
  filterPillActive: {
    backgroundColor: palette.bronze,
    borderColor: palette.bronze
  },
  filterPillText: {
    color: palette.inkSoft,
    fontSize: 12,
    fontWeight: "600"
  },
  filterPillTextActive: {
    color: "#fff"
  },
  createButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    backgroundColor: palette.bronze,
    alignSelf: "flex-start",
    marginBottom: 14
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700"
  },
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
