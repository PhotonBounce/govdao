import { StyleSheet, Text, View } from "react-native";
import { SectionCard } from "./SectionCard";
import { ModulePill } from "./ModulePill";
import { LiveProposalsResult } from "../data/chainSource";
import { darkPalette } from "../theme";

interface LiveProposalsPanelProps {
  result: LiveProposalsResult;
  loading: boolean;
}

function stateTone(label: string): "pine" | "bronze" | "rose" {
  if (label === "Succeeded" || label === "Executed") return "pine";
  if (label === "Defeated" || label === "Cancelled") return "rose";
  return "bronze";
}

function shorten(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

/**
 * Shows proposals read directly from the deployed Governor. Only meaningful in live
 * mode; in fixture mode the result is unavailable and the panel renders nothing.
 */
export function LiveProposalsPanel({ result, loading }: LiveProposalsPanelProps) {
  if (!result.available && result.proposals.length === 0 && !loading) {
    return null;
  }

  return (
    <SectionCard tone="glass" eyebrow="Live On-Chain" title="Governor Proposals" infoKey="proposals-list">
      <Text style={styles.detail}>{loading ? "Reading proposals from the Governor…" : result.detail}</Text>
      {result.proposals.map((p) => (
        <View key={p.id} style={styles.row}>
          <View style={styles.rowHead}>
            <Text style={styles.id}>{p.id}</Text>
            <ModulePill label={p.stateLabel.toUpperCase()} tone={stateTone(p.stateLabel)} />
          </View>
          <Text style={styles.meta} numberOfLines={1}>{p.metadataURI || "(no metadata URI)"}</Text>
          <View style={styles.tallyRow}>
            <Text style={styles.tally}>For {p.forVotes}</Text>
            <Text style={styles.tally}>Against {p.againstVotes}</Text>
            <Text style={styles.tally}>Abstain {p.abstainVotes}</Text>
            <Text style={styles.proposer}>by {shorten(p.proposer)}</Text>
          </View>
        </View>
      ))}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  detail: {
    color: "rgba(224,219,208,0.6)",
    fontSize: 12,
    marginBottom: 10,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: darkPalette.mutedLine,
    gap: 4,
  },
  rowHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  id: {
    color: darkPalette.softGold,
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  meta: {
    color: darkPalette.dimWhite,
    fontSize: 12,
  },
  tallyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  tally: {
    color: "rgba(224,219,208,0.7)",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  proposer: {
    color: "rgba(224,219,208,0.4)",
    fontSize: 11,
    marginLeft: "auto",
  },
});
