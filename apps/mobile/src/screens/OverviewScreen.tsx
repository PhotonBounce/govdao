import { Pressable, StyleSheet, Text, View } from "react-native";
import { ReactNode } from "react";
import { MembersPanel } from "../components/MembersPanel";
import { ModulePill } from "../components/ModulePill";
import { OnchainProofCard } from "../components/OnchainProofCard";
import { SectionCard } from "../components/SectionCard";
import { SignalRow } from "../components/SignalRow";
import { MemberItem } from "../data/mobileDataSource";
import { ActiveView } from "../shellTypes";
import { AppManifest } from "../types";
import { palette, radii } from "../theme";

interface LaunchpadAction {
  label: string;
  subtitle: string;
  view: ActiveView;
}

interface OverviewScreenProps {
  manifest: AppManifest;
  warnings: string[];
  modulesCount: number;
  members: MemberItem[];
  governanceHeadline: string;
  governanceSubtitle: string;
  onchainReady: boolean;
  launchpadActions: LaunchpadAction[];
  offchainAuthLabels: string[];
  memberInviteEnabled?: boolean;
  healthCard?: ReactNode;
  onOpenView: (view: ActiveView) => void;
  onSelectMember: (member: MemberItem) => void;
  onInviteMember?: () => void;
}

export function OverviewScreen({
  manifest,
  warnings,
  modulesCount,
  members,
  governanceHeadline,
  governanceSubtitle,
  onchainReady,
  launchpadActions,
  offchainAuthLabels,
  memberInviteEnabled,
  healthCard,
  onOpenView,
  onSelectMember,
  onInviteMember
}: OverviewScreenProps) {
  return (
    <>
      {healthCard}
      <OnchainProofCard manifest={manifest} />
      {warnings.length > 0 ? (
        <SectionCard
          eyebrow="Setup Needed"
          title="Almost Ready"
          subtitle="Your contracts are live on Polygon. A few backend service URLs still need to be pointed at real endpoints before Google Play submission — they don't affect on-chain governance."
          infoKey="setup-status"
        >
          {warnings.map((warning) => (
            <Text key={warning} style={styles.warningLine}>• {warning}</Text>
          ))}
        </SectionCard>
      ) : null}

      <SectionCard
        eyebrow="Launchpad"
        title="Primary Routes"
        subtitle="Jump to any governance area. Your role determines which actions are available — tap ⓘ to learn what each section does."
        infoKey="launchpad"
      >
        <View style={styles.launchpadGrid}>
          {launchpadActions.map((action) => (
            <Pressable key={action.label} style={styles.launchpadButton} onPress={() => onOpenView(action.view)}>
              <Text style={styles.launchpadTitle}>{action.label}</Text>
              <Text style={styles.launchpadSubtitle}>{action.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard eyebrow="Primary Experience" title={governanceHeadline} subtitle={governanceSubtitle} infoKey="overview">
        <View style={styles.metricRow}>
          <View style={styles.metricBlock}>
            <Text style={styles.metricValue}>{manifest.chain.name}</Text>
            <Text style={styles.metricLabel}>Network</Text>
          </View>
          <View style={styles.metricBlock}>
            <Text style={styles.metricValue}>{manifest.release.android.versionCode}</Text>
            <Text style={styles.metricLabel}>Version Code</Text>
          </View>
          <View style={styles.metricBlock}>
            <Text style={styles.metricValue}>{modulesCount}</Text>
            <Text style={styles.metricLabel}>Live Modules</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard
        eyebrow="Readiness Board"
        title="Operational Status"
        subtitle="Green = live on Polygon. Orange = optional feature not yet wired."
        infoKey="data-status"
      >
        <SignalRow
          label={manifest.governance.mode === "off-chain" ? "Chain settlement path" : "On-chain deployment"}
          value={onchainReady ? "Configured" : manifest.governance.mode === "off-chain" ? "Optional / pending" : "Pending"}
          tone={onchainReady ? "good" : manifest.governance.mode === "off-chain" ? "neutral" : "warning"}
        />
        <SignalRow label="Off-chain governance" value={manifest.governance.offchain.enabled ? "Enabled" : "Disabled"} tone={manifest.governance.offchain.enabled ? "good" : "neutral"} />
        <SignalRow label="Push notifications" value={manifest.features.pushNotifications ? "Included" : "Not included"} tone={manifest.features.pushNotifications ? "good" : "neutral"} />
        <SignalRow label="Companion modules" value={`${modulesCount} enabled`} tone={modulesCount > 1 ? "good" : "warning"} />
      </SectionCard>

      <SectionCard
        eyebrow="Access Layer"
        title={manifest.wallet.required ? "Wallet Plus Managed Access" : "Managed Access"}
        subtitle="Google Play release candidates need a clear member access story. This release combines wallet capabilities with off-chain auth where the governance mode requires it."
        infoKey="wallet-connect"
      >
        <SignalRow label="Wallet required" value={manifest.wallet.required ? "Yes" : "No"} tone={manifest.wallet.required ? "good" : "neutral"} />
        <SignalRow label="Supported wallets" value={manifest.wallet.supported.join(", ")} />
        <SignalRow
          label="Off-chain auth"
          value={manifest.governance.offchain.enabled ? offchainAuthLabels.join(", ") : "Not in use"}
          tone={manifest.governance.offchain.enabled ? "good" : "neutral"}
        />
      </SectionCard>

      <SectionCard
        eyebrow="Governance Engine"
        title={manifest.governance.mode === "on-chain" ? "Direct Settlement" : manifest.governance.mode === "off-chain" ? "Operator Control Plane" : "Hybrid Governance"}
        subtitle={manifest.governance.offchain.enabled
          ? `Off-chain control plane: ${manifest.governance.offchain.provider}. Vote anchoring ${manifest.governance.offchain.voteAnchoringEnabled ? "enabled" : "disabled"}.`
          : "All proposal and vote state resolves on-chain."}
        tone="graphite"
        infoKey="governance-mode"
      >
        <View style={styles.pillRow}>
          {offchainAuthLabels.map((method) => (
            <ModulePill key={method} label={method} tone="bronze" />
          ))}
        </View>
        <Text style={styles.darkMeta}>Proposal storage: {manifest.governance.offchain.proposalStorage}</Text>
        <Text style={styles.darkMeta}>Vote storage: {manifest.governance.offchain.voteStorage}</Text>
        <Text style={styles.darkMeta}>Off-chain API: {manifest.governance.offchain.apiBaseUrl}</Text>
      </SectionCard>

      <SectionCard
        eyebrow="Member Registry"
        title={`${members.length} Registered Member${members.length !== 1 ? "s" : ""}`}
        subtitle="Active members loaded from the registry feed. Tap a member to view their role and on-chain address."
        infoKey="member-registry"
      >
        <MembersPanel members={members} onSelectMember={onSelectMember} />
        {memberInviteEnabled && onInviteMember ? (
          <Pressable style={styles.inviteButton} onPress={onInviteMember}>
            <Text style={styles.inviteButtonText}>Invite Member →</Text>
          </Pressable>
        ) : null}
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  warningLine: {
    color: palette.rose,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  launchpadGrid: {
    gap: 10,
    marginTop: 4
  },
  launchpadButton: {
    padding: 16,
    borderRadius: radii.card,
    backgroundColor: "rgba(217, 205, 184, 0.28)",
    borderWidth: 1,
    borderColor: "rgba(142, 92, 50, 0.12)"
  },
  launchpadTitle: {
    color: palette.graphite,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6
  },
  launchpadSubtitle: {
    color: palette.inkSoft,
    fontSize: 13,
    lineHeight: 19
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  metricBlock: {
    flex: 1,
    backgroundColor: "rgba(217, 205, 184, 0.28)",
    borderRadius: 16,
    padding: 14
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    color: palette.graphite,
    marginBottom: 6
  },
  metricLabel: {
    fontSize: 12,
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  darkMeta: {
    color: "#d9d1c7",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  },
  inviteButton: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.card,
    backgroundColor: palette.graphite,
    alignSelf: "flex-start"
  },
  inviteButtonText: {
    color: palette.paper,
    fontWeight: "700",
    fontSize: 14
  }
});