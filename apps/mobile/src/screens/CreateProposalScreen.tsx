import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ModulePill } from "../components/ModulePill";
import { SectionCard } from "../components/SectionCard";
import { ProposalCreationPhase } from "../data/proposalCreationSource";
import { SessionIdentity } from "../data/sessionSource";
import { ProposalCreationResult, ProposalDraft } from "../data/proposalCreationSource";
import { palette, radii } from "../theme";

interface CreateProposalScreenProps {
  sessionIdentity: SessionIdentity | null;
  draft: ProposalDraft;
  phase: ProposalCreationPhase;
  errors: string[];
  result: ProposalCreationResult | null;
  explorerUrl?: string | null;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSetField: (field: keyof ProposalDraft, value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  onBack: () => void;
  onUseTemplate?: () => void;
}

function PhaseLabel({ phase }: { phase: ProposalCreationPhase }) {
  if (phase === "validating") {
    return <Text style={styles.phaseLabel}>Validating draft…</Text>;
  }
  if (phase === "submitting") {
    return <Text style={styles.phaseLabel}>Submitting to governor… (FIXTURE TX)</Text>;
  }
  return null;
}

export function CreateProposalScreen({
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
  onBack,
  onUseTemplate
}: CreateProposalScreenProps) {
  if (!sessionIdentity) {
    return (
      <SectionCard
        eyebrow="New Proposal"
        title="Sign In Required"
        subtitle="Proposal creation requires an active member session. Sign in using the access panel above."
        tone="graphite"
        infoKey="member-session"
      >
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back to Feed</Text>
        </Pressable>
      </SectionCard>
    );
  }

  if (result) {
    return (
      <SectionCard
        eyebrow="Proposal Submitted"
        title={result.proposalId}
        subtitle="Your draft has been submitted to the governance queue. The proposal will appear in the feed once the chain has processed the transaction."
        tone="graphite"
        infoKey="create-proposal"
      >
        <View style={styles.receiptRow}>
          <ModulePill label="FIXTURE TX" tone="rose" />
          <Text style={styles.receiptTx} numberOfLines={1}>{result.txHash}</Text>
        </View>
        <Text style={styles.receiptNote}>
          The transaction hash above is a fixture placeholder. Wire{" "}
          <Text style={styles.code}>Governor.propose</Text> to replace it with a live submission.
        </Text>
        {explorerUrl ? (
          <Pressable style={styles.explorerButton} onPress={() => Linking.openURL(explorerUrl)}>
            <Text style={styles.explorerButtonText}>View On Block Explorer ↗</Text>
          </Pressable>
        ) : null}
        <View style={styles.actionRow}>
          <Pressable style={styles.resetButton} onPress={onReset}>
            <Text style={styles.resetButtonText}>New Draft</Text>
          </Pressable>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back to Feed</Text>
          </Pressable>
        </View>
      </SectionCard>
    );
  }

  return (
    <>
      <SectionCard
        eyebrow="New Proposal"
        title="Draft Governance Proposal"
        subtitle={`Submitting as ${sessionIdentity.memberLabel} (${sessionIdentity.address.slice(0, 6)}…${sessionIdentity.address.slice(-4)}). Fill in the required fields, then submit.`}
        infoKey="create-proposal"
      >
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back to Feed</Text>
        </Pressable>
        {onUseTemplate ? (
          <Pressable style={styles.templateButton} onPress={onUseTemplate}>
            <Text style={styles.templateButtonText}>✦ Start from a template</Text>
          </Pressable>
        ) : null}
      </SectionCard>

      <SectionCard eyebrow="Required" title="Proposal Details" subtitle="Title and summary are required before submission." infoKey="create-proposal">
        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput
          style={styles.textInput}
          value={draft.title}
          onChangeText={(v) => onSetField("title", v)}
          placeholder="Short, descriptive title (at least 8 characters)"
          placeholderTextColor={palette.inkSoft}
          editable={!isSubmitting}
          maxLength={140}
        />

        <Text style={styles.fieldLabel}>Summary</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={draft.summary}
          onChangeText={(v) => onSetField("summary", v)}
          placeholder="Describe the proposal, its rationale, and expected outcome (at least 20 characters)"
          placeholderTextColor={palette.inkSoft}
          editable={!isSubmitting}
          multiline
          numberOfLines={4}
          maxLength={1000}
        />
      </SectionCard>

      <SectionCard
        eyebrow="Optional"
        title="Document Reference"
        subtitle="Link an off-chain document and anchor its keccak-256 hash for on-chain integrity verification."
        infoKey="proposal-doc"
      >
        <Text style={styles.fieldLabel}>Document URI</Text>
        <TextInput
          style={styles.textInput}
          value={draft.docUri}
          onChangeText={(v) => onSetField("docUri", v)}
          placeholder="https://…"
          placeholderTextColor={palette.inkSoft}
          editable={!isSubmitting}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text style={styles.fieldLabel}>Document Hash (keccak-256)</Text>
        <TextInput
          style={styles.textInput}
          value={draft.docHash}
          onChangeText={(v) => onSetField("docHash", v)}
          placeholder="0x… (66-character hex)"
          placeholderTextColor={palette.inkSoft}
          editable={!isSubmitting}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </SectionCard>

      {errors.length > 0 ? (
        <SectionCard eyebrow="Validation" title="Fix Before Submitting" subtitle="">
          {errors.map((error) => (
            <Text key={error} style={styles.errorLine}>• {error}</Text>
          ))}
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="Submit" title="Send To Governor" subtitle="Settlement is fixture-backed until Governor.propose is wired." infoKey="create-proposal">
        <PhaseLabel phase={phase} />
        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Submitting…" : "Submit Proposal"}
          </Text>
        </Pressable>
        <View style={styles.fixtureRow}>
          <ModulePill label="FIXTURE TX" tone="rose" />
          <Text style={styles.fixtureNote}>Replace with Governor.propose for production</Text>
        </View>
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    color: palette.graphite,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 12
  },
  textInput: {
    height: 40,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "rgba(142, 92, 50, 0.22)",
    backgroundColor: "rgba(251, 248, 239, 0.7)",
    paddingHorizontal: 12,
    color: palette.graphite,
    fontSize: 14
  },
  textArea: {
    height: 100,
    paddingTop: 10,
    textAlignVertical: "top"
  },
  errorLine: {
    color: palette.rose,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4
  },
  phaseLabel: {
    color: palette.moss,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radii.card,
    backgroundColor: palette.bronze,
    alignItems: "center",
    marginBottom: 10
  },
  submitButtonDisabled: {
    opacity: 0.45
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700"
  },
  fixtureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4
  },
  fixtureNote: {
    color: palette.inkSoft,
    fontSize: 12
  },
  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10
  },
  receiptTx: {
    color: palette.moss,
    fontSize: 12,
    fontWeight: "600",
    flex: 1
  },
  receiptNote: {
    color: palette.inkSoft,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14
  },
  code: {
    fontFamily: "monospace",
    color: palette.graphite
  },
  explorerButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    backgroundColor: palette.graphite,
    marginBottom: 14
  },
  explorerButtonText: {
    color: palette.paper,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center"
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap"
  },
  resetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    backgroundColor: palette.bronze
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700"
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    alignSelf: "flex-start"
  },
  backButtonText: {
    color: palette.bronze,
    fontSize: 14,
    fontWeight: "600"
  },
  templateButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: palette.bronze,
    borderRadius: radii.card,
    paddingVertical: 8,
    paddingHorizontal: 14
  },
  templateButtonText: {
    color: palette.bronze,
    fontSize: 13,
    fontWeight: "700"
  }
});
