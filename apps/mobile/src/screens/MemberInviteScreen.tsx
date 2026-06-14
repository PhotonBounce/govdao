import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ModulePill } from "../components/ModulePill";
import { SectionCard } from "../components/SectionCard";
import { InviteDraft, InvitePhase, InviteReceipt, INVITE_ROLES } from "../data/memberInviteSource";
import { SessionIdentity } from "../data/sessionSource";
import { palette, radii } from "../theme";

interface MemberInviteScreenProps {
  sessionIdentity: SessionIdentity | null;
  draft: InviteDraft;
  phase: InvitePhase;
  errors: string[];
  result: InviteReceipt | null;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSetField: <K extends keyof InviteDraft>(key: K, value: InviteDraft[K]) => void;
  onSubmit: () => void;
  onReset: () => void;
  onBack: () => void;
}

function PhaseLabel({ phase }: { phase: InvitePhase }) {
  if (phase === "validating") return <ModulePill label="VALIDATING…" tone="bronze" />;
  if (phase === "submitting") return <ModulePill label="SUBMITTING…" tone="bronze" />;
  if (phase === "pending") return <ModulePill label="PENDING" tone="pine" />;
  if (phase === "error") return <ModulePill label="ERROR" tone="rose" />;
  return null;
}

export function MemberInviteScreen({
  sessionIdentity,
  draft,
  phase,
  errors,
  result,
  isSubmitting,
  canSubmit,
  onSetField,
  onSubmit,
  onReset,
  onBack
}: MemberInviteScreenProps) {
  if (!sessionIdentity) {
    return (
      <SectionCard
        eyebrow="Access Required"
        title="Sign In To Continue"
        subtitle="Member invitations require an active member session with registry write authority."
      >
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back To Overview</Text>
        </Pressable>
      </SectionCard>
    );
  }

  if (phase === "pending" && result) {
    return (
      <>
        <SectionCard
          eyebrow="Invite Submitted"
          title="Member Invite Pending"
          subtitle="The invitation has been submitted to the member registry. It will become active after the 24-hour timelock."
        >
          <View style={styles.receiptRow}>
            <ModulePill label="PENDING" tone="pine" />
            <ModulePill label="FIXTURE" tone="bronze" />
          </View>
          <Text style={styles.receiptLabel}>Invite ID</Text>
          <Text style={styles.receiptValue}>{result.inviteId}</Text>
          <Text style={styles.receiptLabel}>Address</Text>
          <Text style={styles.receiptValue}>{result.address}</Text>
          <Text style={styles.receiptLabel}>Role</Text>
          <Text style={styles.receiptValue}>{result.role}</Text>
          <Text style={styles.receiptLabel}>Display Name</Text>
          <Text style={styles.receiptValue}>{result.displayName}</Text>
          <Text style={styles.receiptLabel}>Timelock</Text>
          <Text style={styles.receiptValue}>{result.timelockLabel}</Text>
          <Pressable style={styles.submitButton} onPress={onReset}>
            <Text style={styles.submitButtonText}>Invite Another Member</Text>
          </Pressable>
          <Pressable style={styles.backButtonAlt} onPress={onBack}>
            <Text style={styles.backButtonAltText}>Back To Overview</Text>
          </Pressable>
        </SectionCard>
      </>
    );
  }

  return (
    <>
      <SectionCard
        eyebrow="Registry"
        title="Invite Member"
        subtitle="Submit a member invitation to the on-chain registry. A 24-hour timelock applies before the address becomes an active governance member."
        infoKey="invite-member"
      >
        <View style={styles.sessionRow}>
          <ModulePill label="SESSION ACTIVE" tone="pine" />
          <Text style={styles.sessionLabel}>{sessionIdentity.memberLabel}</Text>
        </View>
      </SectionCard>

      <SectionCard
        eyebrow="Invitation Details"
        title="Invite Form"
        subtitle="Ethereum address, role assignment, and display name are all required."
        infoKey="member-roles"
      >
        {errors.length > 0 ? (
          <View style={styles.errorBox}>
            {errors.map((err) => (
              <Text key={err} style={styles.errorLine}>• {err}</Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.fieldLabel}>Ethereum Address</Text>
        <TextInput
          style={styles.input}
          value={draft.address}
          onChangeText={(v) => onSetField("address", v)}
          placeholder="0x…"
          placeholderTextColor={palette.inkSoft}
          editable={!isSubmitting}
          autoCapitalize="none"
        />

        <Text style={styles.fieldLabel}>Role</Text>
        <View style={styles.roleRow}>
          {INVITE_ROLES.map((role) => (
            <Pressable
              key={role}
              style={[styles.rolePill, draft.role === role && styles.rolePillActive]}
              onPress={() => onSetField("role", role)}
              disabled={isSubmitting}
            >
              <Text style={[styles.rolePillText, draft.role === role && styles.rolePillTextActive]}>
                {role}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={draft.displayName}
          onChangeText={(v) => onSetField("displayName", v)}
          placeholder="Full name or handle (min 3 chars)"
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
          <Text style={styles.submitButtonText}>Submit Invitation</Text>
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
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(142, 92, 50, 0.22)",
    backgroundColor: "rgba(217, 205, 184, 0.18)"
  },
  rolePillActive: {
    backgroundColor: palette.bronze,
    borderColor: palette.bronze
  },
  rolePillText: {
    color: palette.inkSoft,
    fontSize: 13,
    fontWeight: "600"
  },
  rolePillTextActive: {
    color: "#fff"
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
