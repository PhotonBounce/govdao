import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedShell } from "./src/components/AnimatedShell";
import { ParallaxScrollView } from "./src/components/ParallaxScrollView";
import { PremiumGate } from "./src/components/PremiumGate";
import { InfoModalProvider } from "./src/contexts/InfoModalContext";
import { SoundProvider } from "./src/contexts/SoundContext";
import { PreferencesProvider } from "./src/contexts/PreferencesContext";
import { usePlanGate } from "./src/hooks/usePlanGate";
import { UpgradeScreen } from "./src/screens/UpgradeScreen";
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
import { ActivityScreen } from "./src/screens/ActivityScreen";
import { AnalyticsScreen } from "./src/screens/AnalyticsScreen";
import { DeployWizardScreen } from "./src/screens/DeployWizardScreen";
import { GovernanceCalendarScreen } from "./src/screens/GovernanceCalendarScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
import { loadAnalytics } from "./src/data/analyticsSource";
import { loadGovernanceCalendar } from "./src/data/governanceCalendarSource";
import { SpendRequestScreen } from "./src/screens/SpendRequestScreen";
import { ProposalTimelinePanel } from "./src/components/ProposalTimelinePanel";
import { WorkspaceActionPanel } from "./src/components/WorkspaceActionPanel";
import { loadProposalTimeline } from "./src/data/proposalTimelineSource";
import { useSpendRequestController } from "./src/hooks/useSpendRequestController";
import { useWorkspaceActionController } from "./src/hooks/useWorkspaceActionController";
import { useGuardianDrillController } from "./src/hooks/useGuardianDrillController";
import { useMemberInviteController } from "./src/hooks/useMemberInviteController";
import { QuorumStatusCard } from "./src/components/QuorumStatusCard";
import { ScheduleDrillScreen } from "./src/screens/ScheduleDrillScreen";
import { MemberInviteScreen } from "./src/screens/MemberInviteScreen";
import { VoteBreakdownPanel } from "./src/components/VoteBreakdownPanel";
import { DelegateProfilePanel } from "./src/components/DelegateProfilePanel";
import { loadVoteTally, loadDelegateProfile } from "./src/data/delegateSource";
import { buildExplorerTxUrl } from "./src/data/explorerSource";
import { useMobileShellController } from "./src/hooks/useMobileShellController";
import { useMotionActionController } from "./src/hooks/useMotionActionController";
import { useNotificationController } from "./src/hooks/useNotificationController";
import { useOnchainSnapshot } from "./src/hooks/useOnchainSnapshot";
import { useLiveProposals } from "./src/hooks/useLiveProposals";
import { LiveProposalsPanel } from "./src/components/LiveProposalsPanel";
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
import { darkPalette, radii } from "./src/theme";

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
    closeRequestSpend,
    closeScheduleDrill,
    closeInviteMember,
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
    openCreateProposal,
    openRequestSpend,
    openScheduleDrill,
    openInviteMember
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
  const { castVote, getVoteState, resetVote } = useVoteController(sessionIdentity, manifest);
  const { decideMotion, getMotionActionState, resetMotionAction } = useMotionActionController(
    sessionIdentity,
    manifest.governance.offchain.voteAnchoringEnabled
  );
  const proposalCreation = useProposalCreationController(sessionIdentity, manifest);
  const spendRequest = useSpendRequestController(sessionIdentity, manifest);
  const workspaceActions = useWorkspaceActionController(sessionIdentity, manifest);
  const guardianDrill = useGuardianDrillController(sessionIdentity, manifest);
  const memberInvite = useMemberInviteController(sessionIdentity, manifest);
  const notifications = useNotificationController(manifest);
  const { onchainSnapshot, onchainLoading } = useOnchainSnapshot(manifest);
  const { liveProposals, liveProposalsLoading } = useLiveProposals(manifest);
  const dataMode = getDataModeSummary(dashboardData.source);
  const drillGate = usePlanGate(manifest, "guardian-drill");
  const inviteGate = usePlanGate(manifest, "member-invite");
  const analyticsGate = usePlanGate(manifest, "delegate-analytics");
  const deployWizardGate = usePlanGate(manifest, "deploy-wizard");

  function renderViewHeader() {
    return (
      <SectionCard eyebrow={routeDescriptor.eyebrow} title={routeDescriptor.title} subtitle={routeDescriptor.subtitle} tone="glass" infoKey={activeView === "overview" ? "overview" : activeView === "proposals" ? "proposals-list" : activeView === "create-proposal" ? "create-proposal" : activeView === "treasury" ? "treasury" : activeView === "modules" ? "modules" : activeView === "activity" ? "activity-feed" : activeView === "calendar" ? "governance-calendar" : activeView === "search" ? "search" : activeView === "settings" ? "app-settings" : undefined}>
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
      const quorumPanel = proposals.length > 0 ? (
        <QuorumStatusCard
          manifest={manifest}
          proposalIds={proposals.map((p) => p.id)}
          totalMembers={members.length}
        />
      ) : null;
      const liveProposalsPanel = (liveProposals.available || liveProposalsLoading) ? (
        <LiveProposalsPanel result={liveProposals} loading={liveProposalsLoading} />
      ) : null;
      return (
        <ProposalsScreen
          proposals={proposals}
          motions={motions}
          offchainEnabled={manifest.governance.offchain.enabled}
          proposalCreationEnabled={hasProposalCreation}
          quorumPanel={quorumPanel}
          liveProposalsPanel={liveProposalsPanel}
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
          spendRequestEnabled={hasTreasuryView && !treasury.paused}
          drillSchedulingEnabled={hasTreasuryView}
          onRequestSpend={openRequestSpend}
          onScheduleDrill={openScheduleDrill}
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

    if (activeView === "request-spend") {
      return (
        <SpendRequestScreen
          sessionIdentity={sessionIdentity}
          draft={spendRequest.draft}
          phase={spendRequest.phase}
          errors={spendRequest.errors}
          result={spendRequest.result}
          explorerUrl={spendRequest.result ? buildExplorerTxUrl(manifest, spendRequest.result.txHash) : null}
          isSubmitting={spendRequest.isSubmitting}
          canSubmit={spendRequest.canSubmit}
          onSetField={spendRequest.setField}
          onSubmit={spendRequest.submit}
          onReset={spendRequest.reset}
          onBack={closeRequestSpend}
        />
      );
    }

    if (activeView === "schedule-drill") {
      return (
        <PremiumGate gate={drillGate} onUpgrade={() => openView("upgrade")}>
          <ScheduleDrillScreen
            sessionIdentity={sessionIdentity}
            draft={guardianDrill.draft}
            phase={guardianDrill.phase}
            errors={guardianDrill.errors}
            result={guardianDrill.result}
            isSubmitting={guardianDrill.isSubmitting}
            canSubmit={guardianDrill.canSubmit}
            onSetDrillType={guardianDrill.setDrillType}
            onSetWindowHours={guardianDrill.setWindowHours}
            onSetNotes={guardianDrill.setNotes}
            onSubmit={guardianDrill.submit}
            onReset={guardianDrill.reset}
            onBack={closeScheduleDrill}
          />
        </PremiumGate>
      );
    }

    if (activeView === "invite-member") {
      return (
        <PremiumGate gate={inviteGate} onUpgrade={() => openView("upgrade")}>
          <MemberInviteScreen
            sessionIdentity={sessionIdentity}
            draft={memberInvite.draft}
            phase={memberInvite.phase}
            errors={memberInvite.errors}
            result={memberInvite.result}
            isSubmitting={memberInvite.isSubmitting}
            canSubmit={memberInvite.canSubmit}
            onSetField={memberInvite.setField}
            onSubmit={memberInvite.submit}
            onReset={memberInvite.reset}
            onBack={closeInviteMember}
          />
        </PremiumGate>
      );
    }

    if (activeView === "upgrade") {
      return <UpgradeScreen onBack={() => openView("overview")} />;
    }

    if (activeView === "activity") {
      return <ActivityScreen manifest={manifest} />;
    }

    if (activeView === "analytics") {
      return (
        <PremiumGate gate={analyticsGate} onUpgrade={() => openView("upgrade")}>
          <AnalyticsScreen analytics={loadAnalytics(manifest)} />
        </PremiumGate>
      );
    }

    if (activeView === "calendar") {
      return <GovernanceCalendarScreen calendar={loadGovernanceCalendar(manifest)} />;
    }

    if (activeView === "search") {
      return <SearchScreen onJump={(view) => openView(view)} />;
    }

    if (activeView === "deploy-wizard") {
      return (
        <PremiumGate gate={deployWizardGate} onUpgrade={() => openView("upgrade")}>
          <DeployWizardScreen manifest={manifest} sessionActive={sessionActive} onBack={() => openView("settings")} />
        </PremiumGate>
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
        memberInviteEnabled={hasProposalCreation}
        onOpenView={openView}
        onSelectMember={openMember}
        onInviteMember={openInviteMember}
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

    const voteBreakdownPanel = currentDetail.kind === "proposal"
      ? (() => {
          const tally = loadVoteTally(manifest, currentDetail.refId);
          return tally ? <VoteBreakdownPanel tally={tally} /> : null;
        })()
      : null;

    const proposalTimelinePanel = currentDetail.kind === "proposal"
      ? (() => {
          const timeline = loadProposalTimeline(manifest, currentDetail.refId);
          return timeline ? <ProposalTimelinePanel timeline={timeline} /> : null;
        })()
      : null;

    const detailWorkspace = currentDetail.kind === "workspace"
      ? workspaceItems.find((w) => w.id === currentDetail.refId)
      : undefined;
    const workspaceActionState = detailWorkspace ? workspaceActions.getActionState(detailWorkspace.id) : null;
    const workspaceActionPanel = detailWorkspace ? (
      <WorkspaceActionPanel
        itemId={detailWorkspace.id}
        itemStatus={detailWorkspace.status}
        sessionActive={sessionActive}
        phase={workspaceActionState?.phase ?? "idle"}
        result={workspaceActionState?.result ?? null}
        error={workspaceActionState?.error ?? null}
        onAction={(action) => workspaceActions.performAction(detailWorkspace.id, action)}
        onReset={() => workspaceActions.resetAction(detailWorkspace.id)}
      />
    ) : null;

    const detailMember = currentDetail.kind === "member"
      ? members.find((m) => m.id === currentDetail.refId)
      : undefined;
    const delegatePanel = detailMember
      ? (() => {
          const profile = loadDelegateProfile(manifest, detailMember.id);
          return profile ? <DelegateProfilePanel profile={profile} /> : null;
        })()
      : null;

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
        voteBreakdownPanel={voteBreakdownPanel}
        proposalTimelinePanel={proposalTimelinePanel}
        delegatePanel={delegatePanel}
        workspaceActionPanel={workspaceActionPanel}
        onBack={closeDetail}
        onOpenView={openView}
        onJumpToDetail={jumpToDetail}
        onOpenRelatedDetail={openDetail}
      />
    );
  }

  const heroContent = (
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
  );

  return (
    <PreferencesProvider>
    <SoundProvider>
    <InfoModalProvider>
    <AnimatedShell>
      <StatusBar style="light" />
      <ParallaxScrollView
        contentContainerStyle={styles.content}
        heroContent={heroContent}
        heroContainerStyle={styles.heroContainer}
      >
        <View style={styles.navRow}>
          <NavTab active={activeView === "overview"} label="Overview" onPress={() => openView("overview")} />
          <NavTab active={activeView === "search"} label="Search" onPress={() => openView("search")} />
          {hasProposalView ? <NavTab active={activeView === "proposals"} label="Proposals" onPress={() => openView("proposals")} /> : null}
          {hasProposalCreation ? <NavTab active={activeView === "create-proposal"} label="Propose" onPress={() => openView("create-proposal")} /> : null}
          {hasTreasuryView ? <NavTab active={activeView === "treasury"} label="Treasury" onPress={() => openView("treasury")} /> : null}
          {hasTreasuryView ? <NavTab active={activeView === "request-spend"} label="Spend" onPress={() => openView("request-spend")} /> : null}
          {hasTreasuryView ? <NavTab active={activeView === "schedule-drill"} label="Drill" onPress={() => openView("schedule-drill")} /> : null}
          {hasProposalCreation ? <NavTab active={activeView === "invite-member"} label="Invite" onPress={() => openView("invite-member")} /> : null}
          {hasModuleView ? <NavTab active={activeView === "modules"} label="Modules" onPress={() => openView("modules")} /> : null}
          <NavTab active={activeView === "activity"} label="Activity" onPress={() => openView("activity")} />
          <NavTab active={activeView === "calendar"} label="Calendar" onPress={() => openView("calendar")} />
          <NavTab active={activeView === "analytics"} label="Analytics" onPress={() => openView("analytics")} />
          <NavTab active={activeView === "deploy-wizard"} label="Deploy" onPress={() => openView("deploy-wizard")} />
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
      </ParallaxScrollView>
    </AnimatedShell>
    </InfoModalProvider>
    </SoundProvider>
    </PreferencesProvider>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 68,
    paddingBottom: 40
  },
  heroContainer: {
    marginBottom: 20
  },
  hero: {
    padding: 22,
    backgroundColor: darkPalette.glassCard,
    borderRadius: radii.panel,
    borderWidth: 1,
    borderColor: darkPalette.glassBorder
  },
  kicker: {
    color: darkPalette.softGold,
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
    color: darkPalette.dimWhite,
    marginBottom: 12
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(224,219,208,0.72)",
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
    color: darkPalette.softGold,
    fontSize: 13,
    fontWeight: "600"
  },
  viewModeMeta: {
    color: darkPalette.dimWhite,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8
  },
  modeLine: {
    color: darkPalette.softGold,
    fontSize: 13,
    fontWeight: "600"
  },
  warningLine: {
    color: "#e87070",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  darkMeta: {
    color: darkPalette.dimWhite,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  }
});
