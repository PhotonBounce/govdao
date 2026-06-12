import { Pressable, StyleSheet, Text, View } from "react-native";
import { ModulePill } from "../components/ModulePill";
import { SectionCard } from "../components/SectionCard";
import { SignalRow } from "../components/SignalRow";
import { OnchainSnapshot } from "../data/chainSource";
import { GuardianEventItem, GuardianStatus, TreasuryMovementItem, TreasurySnapshot } from "../data/mobileDataSource";
import { palette, radii } from "../theme";

interface TreasuryScreenProps {
  treasury: TreasurySnapshot;
  movements: TreasuryMovementItem[];
  guardian: GuardianStatus;
  guardianEvents: GuardianEventItem[];
  onchainSnapshot: OnchainSnapshot;
  onchainLoading: boolean;
  spendRequestEnabled?: boolean;
  onRequestSpend?: () => void;
  onSelectMovement: (movement: TreasuryMovementItem) => void;
  onSelectGuardianEvent: (event: GuardianEventItem) => void;
}

export function TreasuryScreen({ treasury, movements, guardian, guardianEvents, onchainSnapshot, onchainLoading, spendRequestEnabled, onRequestSpend, onSelectMovement, onSelectGuardianEvent }: TreasuryScreenProps) {
  return (
    <>
      <SectionCard
        eyebrow="On-Chain Verification"
        title={onchainSnapshot.available ? "Live Contract Reads" : "Awaiting Chain Configuration"}
        subtitle={onchainSnapshot.detail}
      >
        <View style={styles.statusRow}>
          <ModulePill
            label={onchainLoading ? "CHECKING CHAIN" : onchainSnapshot.available ? "LIVE CHAIN" : "NOT CONNECTED"}
            tone={onchainSnapshot.available ? "pine" : "bronze"}
          />
        </View>
        {onchainSnapshot.available ? (
          <>
            <SignalRow label="Block" value={onchainSnapshot.blockNumber ?? "Unavailable"} tone="neutral" />
            <SignalRow label="Treasury balance" value={onchainSnapshot.treasuryBalance ?? "Unavailable"} tone={onchainSnapshot.treasuryBalance ? "good" : "warning"} />
            <SignalRow label="Per-transfer cap" value={onchainSnapshot.spendCapPerTx ?? "Unavailable"} tone="neutral" />
            <SignalRow
              label="Treasury spending"
              value={onchainSnapshot.treasuryPaused === null ? "Unavailable" : onchainSnapshot.treasuryPaused ? "Paused" : "Active"}
              tone={onchainSnapshot.treasuryPaused ? "warning" : "good"}
            />
            <SignalRow label="Members" value={onchainSnapshot.memberCount ?? "Unavailable"} tone="neutral" />
            <SignalRow
              label="Guardian pause"
              value={onchainSnapshot.guardianPaused === null ? "Unavailable" : onchainSnapshot.guardianPaused ? "Engaged" : "Inactive"}
              tone={onchainSnapshot.guardianPaused ? "warning" : "good"}
            />
          </>
        ) : (
          <Text style={styles.noteLine}>The feed cards below stay fixture-backed until the manifest carries a live RPC endpoint and deployed contract addresses.</Text>
        )}
      </SectionCard>
      <SectionCard
        eyebrow="Treasury Transparency"
        title="Balances And Spending Controls"
        subtitle="Members should see what the treasury holds, what it can spend, and whether spending is currently allowed."
      >
        <View style={styles.statusRow}>
          <ModulePill label={treasury.paused ? "SPENDING PAUSED" : "SPENDING ACTIVE"} tone={treasury.paused ? "rose" : "pine"} />
          <Text style={styles.statusMeta}>{treasury.reportingWindow}</Text>
        </View>
        <SignalRow label="Custodian" value={treasury.custodian} tone="good" />
        <SignalRow label="Balance" value={treasury.balance} tone="good" />
        <SignalRow label="Per-transfer cap" value={treasury.perTransferCap} tone="neutral" />
        <SignalRow label="Daily cap" value={treasury.dailyCap} tone="neutral" />
        {spendRequestEnabled && onRequestSpend ? (
          <Pressable style={styles.requestButton} onPress={onRequestSpend}>
            <Text style={styles.requestButtonText}>Request Spend →</Text>
          </Pressable>
        ) : null}
      </SectionCard>

      <SectionCard
        eyebrow="Recent Movements"
        title="Inflows And Outflows"
        subtitle="Every movement settles through the timelock path, so the queue below mirrors what members can verify on-chain."
      >
        {movements.length === 0 ? <Text style={styles.emptyLine}>No treasury movements are available from the active feed yet.</Text> : null}
        {movements.map((movement) => (
          <Pressable key={movement.id} style={styles.feedItem} onPress={() => onSelectMovement(movement)}>
            <View style={styles.feedTopRow}>
              <Text style={styles.feedId}>{movement.id}</Text>
              <ModulePill label={movement.status} tone={movement.status === "Queued" ? "bronze" : "pine"} />
            </View>
            <Text style={styles.feedTitle}>{movement.title}</Text>
            <Text style={styles.feedSummary}>{movement.direction} • {movement.amount} • {movement.counterparty}</Text>
          </Pressable>
        ))}
      </SectionCard>

      <SectionCard
        eyebrow="Emergency Guardian"
        title="Pause Authority Status"
        subtitle="The guardian can only pause, never spend. This panel shows its signer posture and recent emergency activity."
        tone="graphite"
      >
        <View style={styles.statusRow}>
          <ModulePill label={guardian.state.toUpperCase()} tone={guardian.state === "Paused" ? "rose" : "pine"} />
          <Text style={styles.darkStatusMeta}>{guardian.pauseWindow}</Text>
        </View>
        <SignalRow label="Signer threshold" value={guardian.threshold} tone="neutral" />
        <SignalRow label="Signer set" value={guardian.signers} tone="neutral" />
        <SignalRow label="Last drill" value={guardian.lastDrill} tone="neutral" />
        {guardianEvents.length === 0 ? <Text style={styles.darkEmptyLine}>No guardian events are available from the active feed yet.</Text> : null}
        {guardianEvents.map((event) => (
          <Pressable key={event.id} style={styles.darkFeedItem} onPress={() => onSelectGuardianEvent(event)}>
            <View style={styles.feedTopRow}>
              <Text style={styles.feedId}>{event.id}</Text>
              <ModulePill label={event.status} tone={event.status === "Pending" ? "rose" : "pine"} />
            </View>
            <Text style={styles.darkFeedTitle}>{event.title}</Text>
            <Text style={styles.darkFeedSummary}>{event.severity} • Owner {event.owner}</Text>
          </Pressable>
        ))}
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 8
  },
  statusMeta: {
    color: palette.moss,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8
  },
  darkStatusMeta: {
    color: "#d9d1c7",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8
  },
  feedItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(93, 81, 72, 0.12)"
  },
  darkFeedItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(251, 248, 239, 0.14)"
  },
  feedTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  feedId: {
    color: palette.bronze,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  feedTitle: {
    color: palette.graphite,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6
  },
  darkFeedTitle: {
    color: "#fbf8ef",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6
  },
  feedSummary: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6
  },
  darkFeedSummary: {
    color: "#d9d1c7",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6
  },
  emptyLine: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8
  },
  noteLine: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20
  },
  requestButton: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.card,
    backgroundColor: palette.graphite,
    alignSelf: "flex-start"
  },
  requestButtonText: {
    color: palette.paper,
    fontWeight: "700",
    fontSize: 14
  },
  darkEmptyLine: {
    color: "#d9d1c7",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8
  }
});
