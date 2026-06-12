import { Pressable, StyleSheet, Text, View } from "react-native";
import { ModulePill } from "./ModulePill";
import { SectionCard } from "./SectionCard";
import { SignalRow } from "./SignalRow";
import { shortenAddress } from "../data/sessionSource";
import { formatMotionDecision, MotionDecision } from "../data/motionActionSource";
import { MotionActionState } from "../hooks/useMotionActionController";
import { palette, radii } from "../theme";

interface MotionActionPanelProps {
  motionId: string;
  sessionActive: boolean;
  actionState: MotionActionState;
  onDecide: (decision: MotionDecision) => void;
  onReset: () => void;
}

export function MotionActionPanel({ motionId, sessionActive, actionState, onDecide, onReset }: MotionActionPanelProps) {
  if (actionState.status === "recorded" && actionState.receipt) {
    return (
      <SectionCard
        eyebrow="Decision Receipt"
        title={formatMotionDecision(actionState.receipt.decision)}
        subtitle="The decision is recorded against the motion and becomes part of the review trail delegates audit later."
      >
        <View style={styles.pillRow}>
          <ModulePill label="RECORDED" tone="pine" />
          <ModulePill label={actionState.receipt.transport === "fixture" ? "FIXTURE RECORD" : "LIVE RECORD"} tone={actionState.receipt.transport === "fixture" ? "rose" : "pine"} />
          {actionState.receipt.anchored ? <ModulePill label="ANCHORING ON" tone="bronze" /> : null}
        </View>
        <SignalRow label="Motion" value={motionId} tone="neutral" />
        <SignalRow label="Reviewer" value={actionState.receipt.reviewerLabel} tone="good" />
        <SignalRow label="Address" value={shortenAddress(actionState.receipt.reviewer)} tone="neutral" />
        <SignalRow label="Anchor hash" value={shortenAddress(actionState.receipt.anchorHash)} tone="neutral" />
        <Pressable style={styles.secondaryButton} onPress={onReset}>
          <Text style={styles.secondaryButtonText}>Revisit Decision</Text>
        </Pressable>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      eyebrow="Delegate Review"
      title="Record A Decision"
      subtitle={
        sessionActive
          ? "Approvals and returns are recorded by the active session identity and anchored when the deployment enables it."
          : "Recording a decision requires an active member session."
      }
    >
      {!sessionActive ? (
        <Text style={styles.gateLine}>Sign in from the Member Access card to unlock delegate actions for this motion.</Text>
      ) : (
        <>
          {actionState.status === "failed" && actionState.error ? <Text style={styles.errorLine}>{actionState.error}</Text> : null}
          {actionState.status === "reviewing" || actionState.status === "recording" ? (
            <Text style={styles.progressLine}>
              {actionState.status === "reviewing"
                ? `Confirming ${formatMotionDecision(actionState.decision ?? "approve").toLowerCase()} decision…`
                : "Recording the decision into the review trail…"}
            </Text>
          ) : (
            <View style={styles.choiceRow}>
              <Pressable style={[styles.choiceButton, styles.choiceButtonPrimary]} onPress={() => onDecide("approve")}>
                <Text style={[styles.choiceButtonText, styles.choiceButtonTextPrimary]}>Approve</Text>
              </Pressable>
              <Pressable style={styles.choiceButton} onPress={() => onDecide("return")}>
                <Text style={styles.choiceButtonText}>Return For Revision</Text>
              </Pressable>
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
