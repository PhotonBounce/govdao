import { Pressable, StyleSheet, Text, View } from "react-native";
import { ModulePill } from "./ModulePill";
import { SectionCard } from "./SectionCard";
import { SignalRow } from "./SignalRow";
import { AccessOption, SessionIdentity, shortenAddress } from "../data/sessionSource";
import { SessionStatus } from "../hooks/useSessionController";
import { palette, radii } from "../theme";

interface SessionCardProps {
  status: SessionStatus;
  identity: SessionIdentity | null;
  options: AccessOption[];
  required: boolean;
  error: string | null;
  pendingMethodId: string | null;
  onSignIn: (option: AccessOption) => void;
  onSignOut: () => void;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function SessionCard({ status, identity, options, required, error, pendingMethodId, onSignIn, onSignOut }: SessionCardProps) {
  if (status === "signed-in" && identity) {
    return (
      <SectionCard
        eyebrow="Member Access"
        title="Session Active"
        subtitle="Protected modules and signing actions are unlocked for this member identity."
      >
        <View style={styles.pillRow}>
          <ModulePill label={identity.methodLabel.toUpperCase()} tone="pine" />
          <ModulePill label={identity.transport === "fixture" ? "FIXTURE SIGNER" : "LIVE SIGNER"} tone={identity.transport === "fixture" ? "rose" : "pine"} />
        </View>
        <SignalRow label="Member" value={identity.memberLabel} tone="good" />
        <SignalRow label="Address" value={shortenAddress(identity.address)} tone="neutral" />
        <SignalRow label="Role" value={identity.role} tone="neutral" />
        <SignalRow label="Connected" value={formatTimestamp(identity.connectedAt)} tone="neutral" />
        <Pressable style={styles.signOutButton} onPress={onSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </Pressable>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      eyebrow="Member Access"
      title={status === "connecting" ? "Connecting" : "Sign In"}
      subtitle={
        required
          ? "This release requires a connected member identity before protected modules and signing actions unlock."
          : "Sign in to unlock protected modules and signing actions; browsing stays open to guests."
      }
    >
      {error ? <Text style={styles.errorLine}>{error}</Text> : null}
      {options.length === 0 ? (
        <Text style={styles.emptyLine}>No access methods are enabled in the active manifest.</Text>
      ) : null}
      {options.map((option) => {
        const pending = status === "connecting" && pendingMethodId === option.id;
        const disabled = status === "connecting";

        return (
          <Pressable
            key={option.id}
            style={[styles.optionButton, disabled && !pending ? styles.optionButtonDisabled : null]}
            onPress={() => onSignIn(option)}
            disabled={disabled}
          >
            <View style={styles.optionTopRow}>
              <Text style={styles.optionLabel}>{pending ? `Connecting ${option.label}…` : option.label}</Text>
              <ModulePill label={option.kind === "wallet" ? "WALLET" : "OFF-CHAIN"} tone={option.kind === "wallet" ? "pine" : "bronze"} />
            </View>
            <Text style={styles.optionDetail}>{option.detail}</Text>
          </Pressable>
        );
      })}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8
  },
  optionButton: {
    marginTop: 10,
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "rgba(142, 92, 50, 0.24)",
    backgroundColor: "rgba(251, 248, 239, 0.7)"
  },
  optionButtonDisabled: {
    opacity: 0.5
  },
  optionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  optionLabel: {
    color: palette.graphite,
    fontSize: 16,
    fontWeight: "700"
  },
  optionDetail: {
    color: palette.inkSoft,
    fontSize: 13,
    lineHeight: 19
  },
  signOutButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.card,
    backgroundColor: palette.graphite
  },
  signOutButtonText: {
    color: palette.paper,
    fontSize: 14,
    fontWeight: "700"
  },
  errorLine: {
    color: palette.rose,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8
  },
  emptyLine: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8
  }
});
