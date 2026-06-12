import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import manifestJson from "./src/data/app.manifest.json";
import { DataStatusCard } from "./src/components/DataStatusCard";
import { ModulePill } from "./src/components/ModulePill";
import { MotionActionPanel } from "./src/components/MotionActionPanel";
import { NavTab } from "./src/components/NavTab";
import { NotificationPanel } from "./src/components/NotificationPanel";
import { RouteSummaryStrip } from "./src/components/RouteSummaryStrip";
import { SectionCard } from "./src/components/SectionCard";
import { ProposalIntegrityCard } from "./src/components/ProposalIntegrityCard";
import { SessionCard } from "./src/components/SessionCard";
import { VotePanel } from "./src/components/VotePanel";
import { buildExplorerTxUrl } from "./src/data/explorerSource";
import { useMobileShellController } from "./src/hooks/useMobileShellController";
import { useMotionActionController } from "./src/hooks/useMotionActionController";
import { useNotificationController } from "./src/hooks/useNotificationController";
import { useOnchainSnapshot } from "./src/hooks/useOnchainSnapshot";
import { useSessionController } from "./src/hooks/useSessionController";
import { useVoteController } from "./src/hooks/useVoteController";
import { CreateProposalScreen } from "./src/screens/CreateProposalScreen";
import { DetailStackScreen } from "./src/screens/DetailStackScreen";
import { ModulesScreen } from "./src/screens/ModulesScreen";
import { OverviewScreen } from "./src/screens/OverviewScreen";
import { ProposalsScreen } from "./src/screens/ProposalsScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { TreasuryScreen } from "./src/screens/TreasuryScreen";
import { useProposalCreationController } from "./src/hooks/useProposalCreationController";
import { AppManifest } from "./src/types";
import { palette, radii } from "./src/theme";

const manifest = manifestJson as AppManifest;

function getDataModeSummary(source: "mock" | "remote" | "fixture" | "mixed") {
  if (source === "remote") {
    return {
      label: "LIVE FEEDS",
      detail: "Configured services",
      tone: "pine" as const
    };
  }

  if (source === "fixture") {
    return {
      label: "FIXTURE FEEDS",
      detail: "Normalized local transport",
      tone: "rose" as const
    };
  }

  if (source === "mixed") {
    return {
      label: "MIXED FEEDS",
      detail: "Fallbacks active",
      tone: "bronze" as const
    };
  }

  return {
    label: "PREVIEW FEEDS",
    detail: "Local preview records",
    tone: "bronze" as const
  };
}

export default function App() {
  const {
    activeView,
    currentDetail,
    dashboardData,
    dashboardLoading,
    detailActions,
    detailStack,
    governanceHeadline,
    governanceSubtitle,
    guardian,
    guardianEvents,
    hasModuleView,
    hasProposalCreation,
    hasProposalView,
    hasTreasuryView,
    launchpadActions,
    members,
    metadataConfigured,
    modules,
    motions,
    offchainAuthLabels,
    onchainReady,
    proposals,
    refreshDashboard,
    relatedDetails,
    routeDescriptor,
    routeSignals,
    supportConfigured,
    treasury,
    treasuryMovements,
    warnings,
    workspaceItems,
    workspaceModule,
    closeDetail,
    closeCreateProposal,
    jumpToDetail,
    openDetail,
    openGuardianEvent,
    openMember,
    openModule,
    openMotion,
    openProposal,
    openTreasuryMovement,
    openView,
    openWorkspace,
    openCreateProposal
  } = useMobileShellController(manifest);
  const {
    accessOptions,
    sessionActive,
    sessionError,
    sessionIdentity,
    sessionRequired,
    sessionStatus,
    pendingMethodId,
    signIn,
    signOut
  } = useSessionController(manifest);
  const { castVote, getVoteState, resetVote } = useVoteController(sessionIdentity);
  const { decideMotion, getMotionActionState, resetMotionAction } = useMotionActionController(
    sessionIdentity,
    manifest.governance.offchain.voteAnchoringEnabled
  );
  const proposalCreation = useProposalCreationController(sessionIdentity);
  const notifications = useNotificationController(manifest);
  const { onchainSnapshot, onchainLoading } = useOnchainSnapshot(manifest);
  const dataMode = getDataModeSummary(dashboardData.source);

  function renderViewHeader() {
    return (
      <SectionCard eyebrow={routeDescriptor.eyebrow} title={routeDescriptor.title} subtitle={routeDescriptor.subtitle}>
        <View style={styles.viewHeaderRow}>
          <Text style={styles.viewHeaderMeta}>Active route: {activeView}</Text>
          <Text style={styles.viewHeaderMeta}>Stack depth: {detailStack.length}</Text>
        </View>
        <View style={styles.viewModeRow}>
          <ModulePill label={dataMode.label} tone={dataMode.tone} />
          <Text style={styles.viewModeMeta}>{dataMode.detail}</Text>
        </View>
        <RouteSummaryStrip signals={routeSignals} />
      </SectionCard>
    );
  }

  function renderActiveView() {
    if (activeView === "proposals") {
      return (
        <ProposalsScreen
          proposals={proposals}
          motions={motions}
          offchainEnabled={manifest.governance.offchain.enabled}
          proposalCreationEnabled={hasProposalCreation}
          onSelectProposal={openProposal}
          onSelectMotion={openMotion}
          onCreateProposal={openCreateProposal}
        />
      );
    }

    if (activeView === "create-proposal") {
      return (
        <CreateProposalScreen
          sessionIdentity={sessionIdentity}
          draft={proposalCreation.draft}
          phase={proposalCreation.phase}
          errors={proposalCreation.errors}
          result={proposalCreation.result}
          explorerUrl={proposalCreation.result ? buildExplorerTxUrl(manifest, proposalCreation.result.txHash) : null}
          isSubmitting={proposalCreation.isSubmitting}
          canSubmit={proposalCreation.canSubmit}
          onSetField={proposalCreation.setField}
          onSubmit={proposalCreation.submit}
          onReset={proposalCreation.reset}
          onBack={closeCreateProposal}
        />
      );
    }

    if (activeView === "treasury") {
      return (
        <TreasuryScreen
          treasury={treasury}
          movements={treasuryMovements}
          guardian={guardian}
          guardianEvents={guardianEvents}
          onchainSnapshot={onchainSnapshot}
          onchainLoading={onchainLoading}
          onSelectMovement={openTreasuryMovement}
          onSelectGuardianEvent={openGuardianEvent}
        />
      );
    }

    if (activeView === "modules") {
      return (
        <ModulesScreen
          modules={modules}
          sessionActive={sessionActive}
          workspaceModuleTitle={workspaceModule?.title}
          workspaceItems={workspaceItems}
          onSelectModule={openModule}
          onSelectWorkspace={openWorkspace}
        />
      );
    }

    if (activeView === "settings") {
      return (
        <SettingsScreen
          manifest={manifest}
          metadataConfigured={metadataConfigured}
          supportConfigured={supportConfigured}
          notificationPanel={manifest.features.pushNotifications ? (
            <NotificationPanel
              categories={notifications.categories}
              preferences={notifications.preferences}
              saveStatus={notifications.saveStatus}
              saveResult={notifications.saveResult}
              saveError={notifications.saveError}
              onToggleCategory={notifications.toggleCategory}
              onSetFrequency={notifications.setFrequency}
              onSave={notifications.savePreferences}
            />
          ) : undefined}
        />
      );
    }

    return (
      <OverviewScreen
        manifest={manifest}
        warnings={warnings}
        modulesCount={modules.length}
        members={members}
        governanceHeadline={governanceHeadline}
        governanceSubtitle={governanceSubtitle}
        onchainReady={onchainReady}
        launchpadActions={launchpadActions}
        offchainAuthLabels={offchainAuthLabels}
        onOpenView={openView}
        onSelectMember={openMember}
      />
    );
  }

  function renderDetailView() {
    if (!currentDetail) {
      return null;
    }

    const detailProposal = currentDetail.kind === "proposal"
      ? proposals.find((proposal) => proposal.id === currentDetail.refId)
      : undefined;
    const detailVoteState = currentDetail.kind === "proposal" ? getVoteState(currentDetail.refId) : null;
    const votePanel = currentDetail.kind === "proposal" ? (
      <>
        {detailProposal ? <ProposalIntegrityCard manifest={manifest} proposal={detailProposal} /> : null}
        <VotePanel
          proposalId={currentDetail.refId}
          votingEnabled={manifest.features.voting}
          sessionActive={sessionActive}
          voteState={detailVoteState ?? getVoteState(currentDetail.refId)}
          explorerUrl={detailVoteState?.receipt ? buildExplorerTxUrl(manifest, detailVoteState.receipt.txHash) : null}
          onCastVote={(choice) => castVote(currentDetail.refId, choice)}
          onResetVote={() => resetVote(currentDetail.refId)}
        />
      </>
    ) : currentDetail.kind === "motion" && manifest.governance.offchain.enabled ? (
      <MotionActionPanel
        motionId={currentDetail.refId}
        sessionActive={sessionActive}
        actionState={getMotionActionState(currentDetail.refId)}
        onDecide={(decision) => decideMotion(currentDetail.refId, decision)}
        onReset={() => resetMotionAction(currentDetail.refId)}
      />
    ) : undefined;

    return (
      <DetailStackScreen
        activeView={activeView}
        detailStack={detailStack}
        currentDetail={currentDetail}
        actions={detailActions}
        relatedDetails={relatedDetails}
        votePanel={votePanel}
        onBack={closeDetail}
        onOpenView={openView}
        onJumpToDetail={jumpToDetail}
        onOpenRelatedDetail={openDetail}
      />
    );
  }

  return (
    <LinearGradient colors={[palette.sand, "#efe2c9", "#d8c1a6"]} style={styles.shell}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Google Play Release Candidate</Text>
          <Text style={styles.title}>{manifest.app.name}</Text>
          <Text style={styles.description}>{manifest.release.listing.fullDescription}</Text>
          <View style={styles.pillRow}>
            <ModulePill label={manifest.governance.mode.toUpperCase()} tone="pine" />
            <ModulePill label={manifest.app.distribution.pricingModel.toUpperCase()} tone="bronze" />
            <ModulePill label={`TRACK ${manifest.release.android.track.toUpperCase()}`} tone="rose" />
            <ModulePill label={dataMode.label} tone={dataMode.tone} />
          </View>
          <Text style={styles.modeLine}>Current data mode: {dataMode.detail}</Text>
        </View>

        <View style={styles.navRow}>
          <NavTab active={activeView === "overview"} label="Overview" onPress={() => openView("overview")} />
          {hasProposalView ? <NavTab active={activeView === "proposals"} label="Proposals" onPress={() => openView("proposals")} /> : null}
          {hasProposalCreation ? <NavTab active={activeView === "create-proposal"} label="Propose" onPress={() => openView("create-proposal")} /> : null}
          {hasTreasuryView ? <NavTab active={activeView === "treasury"} label="Treasury" onPress={() => openView("treasury")} /> : null}
          {hasModuleView ? <NavTab active={activeView === "modules"} label="Modules" onPress={() => openView("modules")} /> : null}
          <NavTab active={activeView === "settings"} label="Settings" onPress={() => openView("settings")} />
        </View>

        <DataStatusCard
          loading={dashboardLoading}
          source={dashboardData.source}
          syncMessage={dashboardData.syncMessage}
          lastUpdatedAt={dashboardData.lastUpdatedAt}
          endpoints={dashboardData.endpoints}
          onRefresh={refreshDashboard}
        />

        <SessionCard
          status={sessionStatus}
          identity={sessionIdentity}
          options={accessOptions}
          required={sessionRequired}
          error={sessionError}
          pendingMethodId={pendingMethodId}
          onSignIn={signIn}
          onSignOut={signOut}
        />

        {currentDetail ? renderDetailView() : (
          <>
            {renderViewHeader()}
            {renderActiveView()}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 68,
    paddingBottom: 40
  },
  hero: {
    marginBottom: 20,
    padding: 22,
    backgroundColor: "rgba(251, 248, 239, 0.84)",
    borderRadius: radii.panel,
    borderWidth: 1,
    borderColor: "rgba(142, 92, 50, 0.18)"
  },
  kicker: {
    color: palette.bronze,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 12
  },
  title: {
    fontSize: 42,
    lineHeight: 44,
    fontWeight: "700",
    color: palette.graphite,
    marginBottom: 12
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.inkSoft,
    marginBottom: 16
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  navRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12
  },
  viewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 6
  },
  viewModeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 4
  },
  viewHeaderMeta: {
    color: palette.moss,
    fontSize: 13,
    fontWeight: "600"
  },
  viewModeMeta: {
    color: palette.inkSoft,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8
  },
  modeLine: {
    color: palette.moss,
    fontSize: 13,
    fontWeight: "600"
  },
  warningLine: {
    color: palette.rose,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  darkMeta: {
    color: "#d9d1c7",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  }
});
