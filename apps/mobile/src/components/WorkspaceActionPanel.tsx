import { Pressable, StyleSheet, Text, View } from "react-native";
import { WorkspaceAction, WorkspaceActionPhase, WorkspaceActionResult, allowedActions, formatWorkspaceAction } from "../data/workspaceActionSource";
import { ModulePill } from "./ModulePill";
import { palette, radii } from "../theme";

interface WorkspaceActionPanelProps {
  itemId: string;
  itemStatus: string;
  sessionActive: boolean;
  phase: WorkspaceActionPhase;
  result: WorkspaceActionResult | null;
  error: string | null;
  onAction: (action: WorkspaceAction) => void;
  onReset: () => void;
}

const ACTION_TONES: Record<WorkspaceAction, "pine" | "bronze" | "rose"> = {
  "request-review": "bronze",
  "publish": "pine",
  "archive": "rose"
};

export function WorkspaceActionPanel({
  itemId,
  itemStatus,
  sessionActive,
  phase,
  result,
  error,
  onAction,
  onReset
}: WorkspaceActionPanelProps) {
  if (!sessionActive) {
    return (
      <View style={styles.gateRow}>
        <ModulePill label="SIGN IN REQUIRED" tone="rose" />
        <Text style={styles.gateNote}>Sign in to perform workspace actions.</Text>
      </View>
    );
  }

  if (phase === "done" && result) {
    return (
      <>
        <View style={styles.receiptRow}>
          <ModulePill label="ACTION RECORDED" tone="pine" />
          <ModulePill label="FIXTURE" tone="bronze" />
        </View>
        <Text style={styles.receiptAction}>{formatWorkspaceAction(result.action)}</Text>
        <Text style={styles.receiptMessage}>{result.message}</Text>
        <Pressable style={styles.resetButton} onPress={onReset}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </Pressable>
      </>
    );
  }

  if (phase === "error" && error) {
    return (
      <>
        <View style={styles.errorRow}>
          <ModulePill label="FAILED" tone="rose" />
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.resetButton} onPress={onReset}>
          <Text style={styles.resetButtonText}>Try Again</Text>
        </Pressable>
      </>
    );
  }

  if (phase === "submitting") {
    return (
      <View style={styles.progressRow}>
        <ModulePill label="SUBMITTING…" tone="bronze" />
        <Text style={styles.progressNote}>Processing workspace action for {itemId}…</Text>
      </View>
    );
  }

  const actions = allowedActions(itemStatus);

  return (
    <View style={styles.actionRow}>
      {actions.map((action) => (
        <Pressable
          key={action}
          style={[styles.actionButton, action === "archive" && styles.archiveButton]}
          onPress={() => onAction(action)}
        >
          <Text style={[styles.actionButtonText, action === "archive" && styles.archiveButtonText]}>
            {formatWorkspaceAction(action)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gateRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10
  },
  gateNote: {
    color: palette.inkSoft,
    fontSize: 13
  },
  receiptRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10
  },
  receiptAction: {
    color: palette.graphite,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6
  },
  receiptMessage: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10
  },
  errorRow: {
    flexDirection: "row",
    marginBottom: 8
  },
  errorText: {
    color: palette.rose,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10
  },
  progressRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10
  },
  progressNote: {
    color: palette.inkSoft,
    fontSize: 13
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.card,
    backgroundColor: palette.graphite
  },
  archiveButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: palette.rose
  },
  actionButtonText: {
    color: palette.paper,
    fontSize: 14,
    fontWeight: "700"
  },
  archiveButtonText: {
    color: palette.rose
  },
  resetButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: "rgba(93, 81, 72, 0.10)",
    alignSelf: "flex-start"
  },
  resetButtonText: {
    color: palette.graphite,
    fontSize: 13,
    fontWeight: "600"
  }
});
