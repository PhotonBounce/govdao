import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ModulePill } from "../components/ModulePill";
import { SectionCard } from "../components/SectionCard";
import { SpendRequestDraft, SpendRequestPhase, SpendRequestResult } from "../data/treasuryRequestSource";
import { SessionIdentity } from "../data/sessionSource";
import { palette, radii } from "../theme";

interface SpendRequestScreenProps {
  sessionIdentity: SessionIdentity | null;
  draft: SpendRequestDraft;
  phase: SpendRequestPhase;
  errors: string[];
  result: SpendRequestResult | null;
  explorerUrl: string | null | undefined;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSetField: <K extends keyof SpendRequestDraft>(key: K, value: SpendRequestDraft[K]) => void;
  onSubmit: () => void;
  onReset: () => void;
  onBack: () => void;
}

function PhaseLabel({ phase }: { phase: SpendRequestPhase }) {
  if (phase === "validating") return <ModulePill label="VALIDATING…" tone="bronze" />;
  if (phase === "submitting") return <ModulePill label="SUBMITTING…" tone="bronze" />;
  if (phase === "queued") return <ModulePill label="QUEUED" tone="pine" />;
  if (phase === "error") return <ModulePill label="ERROR" tone="rose" />;
  return null;
}

export function SpendRequestScreen({
  sessionIdentity,
  draft,
  phase,
  errors,
  result,
  explorerUrl,
  isSubmitting,
  canSubmit,
  onSetField,
  onSubmit,
  onReset,
  onBack
}: SpendRequestScreenProps) {
  if (!sessionIdentity) {
    return (
      <SectionCard eyebrow="Access Required" title="Sign In To Continue" subtitle="Treasury spend requests require an active member session with proposal-creation authority.">
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back To Treasury</Text>
        </Pressable>
      </SectionCard>
    );
  }

  if (phase === "queued" && result) {
    return (
      <>
        <SectionCard eyebrow="Request Submitted" title="Spend Request Queued" subtitle="The request has been queued in the treasury timelock. It will execute after the timelock window expires.">
          <View style={styles.receiptRow}>
            <ModulePill label="QUEUED" tone="pine" />
            <ModulePill label="FIXTURE TX" tone="bronze" />
          </View>
          <Text style={styles.receiptLabel}>Request ID</Text>
          <Text style={styles.receiptValue}>{result.requestId}</Text>
          <Text style={styles.receiptLabel}>Transaction</Text>
          <Text style={styles.receiptValue}>{result.txHash.slice(0, 14)}…{result.txHash.slice(-8)}</Text>
          <Text style={styles.receiptLabel}>Timelock</Text>
          <Text style={styles.receiptValue}>{result.timelockEtaLabel}</Text>
          {explorerUrl ? (
            <Text style={styles.explorerLink}>View on Block Explorer ↗</Text>
          ) : null}
          <Pressable style={styles.submitButton} onPress={onReset}>
            <Text style={styles.submitButtonText}>Submit Another Request</Text>
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
      <SectionCard eyebrow="Treasury" title="Request Spend" subtitle="Submit a spend request to the treasury timelock. Requests exceeding the 25 ETH per-transfer cap will be rejected." infoKey="spend-request">
        <View style={styles.sessionRow}>
          <ModulePill label="SESSION ACTIVE" tone="pine" />
          <Text style={styles.sessionLabel}>{sessionIdentity.memberLabel}</Text>
        </View>
      </SectionCard>

      <SectionCard eyebrow="Request Details" title="Spend Request Form" subtitle="All fields except Doc URI are required. Amount must not exceed the 25 ETH per-transfer cap." infoKey="timelock">
        {errors.length > 0 ? (
          <View style={styles.errorBox}>
            {errors.map((err) => (
              <Text key={err} style={styles.errorLine}>• {err}</Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput
          style={styles.input}
          value={draft.title}
          onChangeText={(v) => onSetField("title", v)}
          placeholder="Brief description of the spend"
          placeholderTextColor={palette.inkSoft}
          editable={!isSubmitting}
        />

        <Text style={styles.fieldLabel}>Amount (ETH)</Text>
        <TextInput
          style={styles.input}
          value={draft.amount}
          onChangeText={(v) => onSetField("amount", v)}
          placeholder="e.g. 5.0"
          placeholderTextColor={palette.inkSoft}
          editable={!isSubmitting}
          keyboardType="decimal-pad"
        />

        <Text style={styles.fieldLabel}>Recipient Address</Text>
        <TextInput
          style={styles.input}
          value={draft.recipientAddress}
          onChangeText={(v) => onSetField("recipientAddress", v)}
          placeholder="0x…"
          placeholderTextColor={palette.inkSoft}
          editable={!isSubmitting}
        />

        <Text style={styles.fieldLabel}>Purpose</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={draft.purpose}
          onChangeText={(v) => onSetField("purpose", v)}
          placeholder="Explain how the funds will be used (min 20 chars)"
          placeholderTextColor={palette.inkSoft}
          editable={!isSubmitting}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.fieldLabel}>Supporting Doc URI (optional)</Text>
        <TextInput
          style={styles.input}
          value={draft.docUri ?? ""}
          onChangeText={(v) => onSetField("docUri", v)}
          placeholder="https:// or ipfs:// or fixture://"
          placeholderTextColor={palette.inkSoft}
          editable={!isSubmitting}
        />

        <View style={styles.phaseRow}>
          <PhaseLabel phase={phase} />
        </View>

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>Submit Spend Request</Text>
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
    height: 80,
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
  },
  explorerLink: {
    color: palette.bronze,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10
  }
});
