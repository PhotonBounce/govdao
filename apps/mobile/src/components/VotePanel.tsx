import { useEffect, useRef } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useSound } from "../contexts/SoundContext";
import { ModulePill } from "./ModulePill";
import { SectionCard } from "./SectionCard";
import { SignalRow } from "./SignalRow";
import { shortenAddress } from "../data/sessionSource";
import { formatVoteChoice, VoteChoice } from "../data/voteSource";
import { VoteState } from "../hooks/useVoteController";
import { palette, radii } from "../theme";

interface VotePanelProps {
  proposalId: string;
  votingEnabled: boolean;
  sessionActive: boolean;
  voteState: VoteState;
  explorerUrl?: string | null;
  onCastVote: (choice: VoteChoice) => void;
  onResetVote: () => void;
}

const choices: VoteChoice[] = ["for", "against", "abstain"];

export function VotePanel({ proposalId, votingEnabled, sessionActive, voteState, explorerUrl, onCastVote, onResetVote }: VotePanelProps) {
  const { play } = useSound();
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (voteState.status === "confirmed" && !confirmedRef.current) {
      confirmedRef.current = true;
      play("receipt");
    } else if (voteState.status !== "confirmed") {
      confirmedRef.current = false;
    }
  }, [voteState.status]);

  if (!votingEnabled) {
    return null;
  }

  if (voteState.status === "confirmed" && voteState.receipt) {
    return (
      <SectionCard
        eyebrow="Vote Receipt"
        title={`Voted ${formatVoteChoice(voteState.receipt.choice)}`}
        subtitle="The transaction confirmed and this receipt is what a member would attach to a dispute or audit trail."
        infoKey="vote-receipt"
      >
        <View style={styles.pillRow}>
          <ModulePill label="CONFIRMED" tone="pine" />
          <ModulePill label={voteState.receipt.transport === "fixture" ? "FIXTURE TX" : "ON-CHAIN TX"} tone={voteState.receipt.transport === "fixture" ? "rose" : "pine"} />
        </View>
        <SignalRow label="Proposal" value={proposalId} tone="neutral" />
        <SignalRow label="Voter" value={voteState.receipt.voterLabel} tone="good" />
        <SignalRow label="Address" value={shortenAddress(voteState.receipt.voter)} tone="neutral" />
        <SignalRow label="Tx hash" value={shortenAddress(voteState.receipt.txHash)} tone="neutral" />
        {explorerUrl ? (
          <Pressable style={styles.explorerButton} onPress={() => Linking.openURL(explorerUrl)}>
            <Text style={styles.explorerButtonText}>View On Block Explorer ↗</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.secondaryButton} onPress={onResetVote}>
          <Text style={styles.secondaryButtonText}>Change Vote</Text>
        </Pressable>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      eyebrow="Cast Vote"
      title="Member Ballot"
      infoKey="vote-ballot"
      subtitle={
        sessionActive
          ? "Votes are signed by the active session identity and confirmed before the receipt is shown."
          : "Voting requires an active member session."
      }
    >
      {!sessionActive ? (
        <Text style={styles.gateLine}>Sign in from the Member Access card to unlock the ballot for this proposal.</Text>
      ) : (
        <>
          {voteState.status === "failed" && voteState.error ? <Text style={styles.errorLine}>{voteState.error}</Text> : null}
          {voteState.status === "signing" || voteState.status === "pending" ? (
            <Text style={styles.progressLine}>
              {voteState.status === "signing"
                ? `Signing ${formatVoteChoice(voteState.choice ?? "for")} vote…`
                : `Waiting for confirmation of the ${formatVoteChoice(voteState.choice ?? "for")} vote…`}
            </Text>
          ) : (
            <View style={styles.choiceRow}>
              {choices.map((choice) => (
                <Pressable key={choice} style={[styles.choiceButton, choice === "for" ? styles.choiceButtonPrimary : null]} onPress={() => { play("vote"); onCastVote(choice); }}>
                  <Text style={[styles.choiceButtonText, choice === "for" ? styles.choiceButtonTextPrimary : null]}>{formatVoteChoice(choice)}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4
  },
  choiceButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: "rgba(251, 248, 239, 0.72)"
  },
  choiceButtonPrimary: {
    backgroundColor: palette.graphite,
    borderColor: palette.graphite
  },
  choiceButtonText: {
    color: palette.graphite,
    fontSize: 14,
    fontWeight: "700"
  },
  choiceButtonTextPrimary: {
    color: palette.paper
  },
  explorerButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.card,
    backgroundColor: palette.graphite
  },
  explorerButtonText: {
    color: palette.paper,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center"
  },
  secondaryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: "transparent"
  },
  secondaryButtonText: {
    color: palette.graphite,
    fontSize: 14,
    fontWeight: "700"
  },
  gateLine: {
    color: palette.rose,
    fontSize: 14,
    lineHeight: 20
  },
  errorLine: {
    color: palette.rose,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8
  },
  progressLine: {
    color: palette.moss,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20
  }
});
