import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ModulePill } from "../components/ModulePill";
import { SectionCard } from "../components/SectionCard";
import { DrillDraft, DrillPhase, DrillReceipt, DrillType, formatDrillType } from "../data/guardianDrillSource";
import { SessionIdentity } from "../data/sessionSource";
import { palette, radii } from "../theme";

const DRILL_TYPES: DrillType[] = ["pause", "resume", "full-cycle"];

interface ScheduleDrillScreenProps {
  sessionIdentity: SessionIdentity | null;
  draft: DrillDraft;
  phase: DrillPhase;
  errors: string[];
  result: DrillReceipt | null;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSetDrillType: (type: DrillType) => void;
  onSetWindowHours: (hours: number) => void;
  onSetNotes: (notes: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  onBack: () => void;
}

function PhaseLabel({ phase }: { phase: DrillPhase }) {
  if (phase === "validating") return <ModulePill label="VALIDATING…" tone="bronze" />;
  if (phase === "scheduling") return <ModulePill label="SCHEDULING…" tone="bronze" />;
  if (phase === "scheduled") return <ModulePill label="SCHEDULED" tone="pine" />;
  if (phase === "error") return <ModulePill label="ERROR" tone="rose" />;
  return null;
}

export function ScheduleDrillScreen({
  sessionIdentity,
  draft,
  phase,
  errors,
  result,
  isSubmitting,
  canSubmit,
  onSetDrillType,
  onSetWindowHours,
  onSetNotes,
  onSubmit,
  onReset,
  onBack
}: ScheduleDrillScreenProps) {
  if (!sessionIdentity) {
    return (
      <SectionCard
        eyebrow="Access Required"
        title="Sign In To Continue"
        subtitle="Scheduling a guardian drill requires an active member session with guardian authority."
      >
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back To Treasury</Text>
        </Pressable>
      </SectionCard>
    );
  }

  if (phase === "scheduled" && result) {
    return (
      <>
        <SectionCard
          eyebrow="Drill Scheduled"
          title="Guardian Drill Queued"
          subtitle="The drill has been queued. All required signers will be notified via the guardian alert channel."
        >
          <View style={styles.receiptRow}>
            <ModulePill label="SCHEDULED" tone="pine" />
            <ModulePill label="FIXTURE" tone="bronze" />
          </View>
          <Text style={styles.receiptLabel}>Drill ID</Text>
          <Text style={styles.receiptValue}>{result.drillId}</Text>
          <Text style={styles.receiptLabel}>Type</Text>
          <Text style={styles.receiptValue}>{formatDrillType(result.drillType)}</Text>
          <Text style={styles.receiptLabel}>Scheduled At</Text>
          <Text style={styles.receiptValue}>{new Date(result.scheduledAt).toLocaleString()}</Text>
          <Text style={styles.receiptLabel}>Window</Text>
          <Text style={styles.receiptValue}>{result.windowLabel}</Text>
          <Text style={styles.receiptLabel}>Required Signers</Text>
          <Text style={styles.receiptValue}>{result.requiredSigners}</Text>
          <Pressable style={styles.submitButton} onPress={onReset}>
            <Text style={styles.submitButtonText}>Schedule Another Drill</Text>
          </Pressable>
          <Pressable style={styles.backButtonAlt} onPress={onBack}>
            <Text style={styles.backButtonAltText}>Back To Treasury</Text>
          </Pressable>
        </SectionCard>
      </>
    );
  }

  return (
    <>
      <SectionCard
        eyebrow="Guardian"
        title="Schedule Drill"
        subtitle="Schedule a guardian drill to verify the emergency pause and resume signer posture. Requires the full threshold of required signers."
        infoKey="schedule-drill"
      >
        <View style={styles.sessionRow}>
          <ModulePill label="SESSION ACTIVE" tone="pine" />
          <Text style={styles.sessionLabel}>{sessionIdentity.memberLabel}</Text>
        </View>
      </SectionCard>

      <SectionCard
        eyebrow="Drill Details"
        title="Drill Configuration"
        subtitle="Select the drill type, the coordination window, and add notes for the signer set."
        infoKey="drill-types"
      >
        {errors.length > 0 ? (
          <View style={styles.errorBox}>
            {errors.map((err) => (
              <Text key={err} style={styles.errorLine}>• {err}</Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.fieldLabel}>Drill Type</Text>
        <View style={styles.typeRow}>
          {DRILL_TYPES.map((type) => (
            <Pressable
              key={type}
              style={[styles.typePill, draft.drillType === type && styles.typePillActive]}
              onPress={() => onSetDrillType(type)}
              disabled={isSubmitting}
            >
              <Text style={[styles.typePillText, draft.drillType === type && styles.typePillTextActive]}>
                {formatDrillType(type)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Coordination Window (hours)</Text>
        <TextInput
          style={styles.input}
          value={String(draft.scheduledWindowHours)}
          onChangeText={(v) => {
            const n = parseInt(v, 10);
            if (!isNaN(n)) onSetWindowHours(n);
          }}
          placeholder="e.g. 4"
          placeholderTextColor={palette.inkSoft}
          editable={!isSubmitting}
          keyboardType="number-pad"
        />

        <Text style={styles.fieldLabel}>Notes For Signers</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={draft.notesForSigners}
          onChangeText={onSetNotes}
          placeholder="Explain the drill purpose and any coordination notes (min 10 chars)"
          placeholderTextColor={palette.inkSoft}
          editable={!isSubmitting}
          multiline
          numberOfLines={4}
        />

        <View style={styles.phaseRow}>
          <PhaseLabel phase={phase} />
        </View>

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>Schedule Drill</Text>
        </Pressable>

        <Pressable style={styles.backButtonAlt} onPress={onBack}>
          <Text style={styles.backButtonAltText}>Cancel</Text>
        </Pressable>
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  sessionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10
  },
  sessionLabel: {
    color: palette.moss,
    fontSize: 14,
    fontWeight: "600"
  },
  errorBox: {
    backgroundColor: "rgba(160, 77, 74, 0.08)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14
  },
  errorLine: {
    color: palette.rose,
    fontSize: 13,
    lineHeight: 20
  },
  fieldLabel: {
    color: palette.inkSoft,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 14
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(142, 92, 50, 0.22)",
    backgroundColor: "rgba(217, 205, 184, 0.18)"
  },
  typePillActive: {
    backgroundColor: palette.graphite,
    borderColor: palette.graphite
  },
  typePillText: {
    color: palette.inkSoft,
    fontSize: 13,
    fontWeight: "600"
  },
  typePillTextActive: {
    color: "#fff"
  },
  input: {
    backgroundColor: "rgba(217, 205, 184, 0.28)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.graphite,
    fontSize: 15
  },
  textArea: {
    height: 90,
    textAlignVertical: "top"
  },
  phaseRow: {
    flexDirection: "row",
    marginTop: 16,
    marginBottom: 4,
    minHeight: 28
  },
  submitButton: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.card,
    backgroundColor: palette.graphite,
    alignItems: "center"
  },
  submitButtonDisabled: {
    opacity: 0.4
  },
  submitButtonText: {
    color: palette.paper,
    fontWeight: "700",
    fontSize: 14
  },
  backButton: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.card,
    backgroundColor: palette.graphite,
    alignItems: "center"
  },
  backButtonText: {
    color: palette.paper,
    fontWeight: "700",
    fontSize: 14
  },
  backButtonAlt: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.card,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: "center"
  },
  backButtonAltText: {
    color: palette.graphite,
    fontWeight: "700",
    fontSize: 14
  },
  receiptRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14
  },
  receiptLabel: {
    color: palette.inkSoft,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 10
  },
  receiptValue: {
    color: palette.graphite,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
    fontFamily: "monospace"
  }
});
