import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import manifestJson from "./src/data/app.manifest.json";
import { DataStatusCard } from "./src/components/DataStatusCard";
import { ModulePill } from "./src/components/ModulePill";
import { NavTab } from "./src/components/NavTab";
import { RouteSummaryStrip } from "./src/components/RouteSummaryStrip";
import { SectionCard } from "./src/components/SectionCard";
import { useMobileShellController } from "./src/hooks/useMobileShellController";
import { DetailStackScreen } from "./src/screens/DetailStackScreen";
import { ModulesScreen } from "./src/screens/ModulesScreen";
import { OverviewScreen } from "./src/screens/OverviewScreen";
import { ProposalsScreen } from "./src/screens/ProposalsScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
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
    hasModuleView,
    hasProposalView,
    launchpadActions,
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
    warnings,
    workspaceItems,
    workspaceModule,
    closeDetail,
    jumpToDetail,
    openDetail,
    openModule,
    openMotion,
    openProposal,
    openView,
    openWorkspace
  } = useMobileShellController(manifest);
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
          onSelectProposal={openProposal}
          onSelectMotion={openMotion}
        />
      );
    }

    if (activeView === "modules") {
      return (
        <ModulesScreen
          modules={modules}
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
        />
      );
    }

    return (
      <OverviewScreen
        manifest={manifest}
        warnings={warnings}
        modulesCount={modules.length}
        governanceHeadline={governanceHeadline}
        governanceSubtitle={governanceSubtitle}
        onchainReady={onchainReady}
        launchpadActions={launchpadActions}
        offchainAuthLabels={offchainAuthLabels}
        onOpenView={openView}
      />
    );
  }

  function renderDetailView() {
    if (!currentDetail) {
      return null;
    }

    return (
      <DetailStackScreen
        activeView={activeView}
        detailStack={detailStack}
        currentDetail={currentDetail}
        actions={detailActions}
        relatedDetails={relatedDetails}
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
