import { useEffect, useMemo, useState } from "react";
import { useMobileDashboardData } from "./useMobileDashboardData";
import { ActiveView, DetailState } from "../shellTypes";
import { AppManifest } from "../types";
import {
  buildGuardianEventDetail,
  buildMemberDetail,
  buildModuleDetail,
  buildMotionDetail,
  buildProposalDetail,
  buildTreasuryMovementDetail,
  buildWorkspaceDetail,
  deriveWarnings,
  formatAuthLabel,
  isPlaceholder,
  ModuleItem,
  DetailAction,
  LaunchpadAction,
  RelatedDetailAction,
  RouteSignal,
  ViewDescriptor
} from "../shell/mobileShellUtils";

export function useMobileShellController(manifest: AppManifest) {
  const { dashboardData, loading: dashboardLoading, refresh: refreshDashboard } = useMobileDashboardData(manifest);
  const [activeView, setActiveView] = useState<ActiveView>("overview");
  const [detailStack, setDetailStack] = useState<DetailState[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<string>("");
  const [selectedMotionId, setSelectedMotionId] = useState<string>("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [selectedMovementId, setSelectedMovementId] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>(manifest.experiences.primaryModuleId);

  const modules = useMemo(() => manifest.experiences.modules.filter((module) => module.enabled), [manifest]);
  const proposals = dashboardData.proposals;
  const motions = dashboardData.motions;
  const workspaceItems = dashboardData.workspaceItems;
  const treasury = dashboardData.treasury;
  const treasuryMovements = dashboardData.treasuryMovements;
  const guardian = dashboardData.guardian;
  const guardianEvents = dashboardData.guardianEvents;
  const members = dashboardData.members;
  const primaryModule = modules.find((module) => module.id === manifest.experiences.primaryModuleId) ?? modules[0];
  const selectedModule = modules.find((module) => module.id === selectedModuleId) ?? primaryModule;
  const workspaceModule = modules.find((module) => module.id !== "dao") ?? modules[0];
  const warnings = useMemo(() => deriveWarnings(manifest), [manifest]);
  const onchainReady = Object.values(manifest.contracts).every((address) => !isPlaceholder(address));
  const hasProposalView = manifest.features.proposalFeed || manifest.governance.offchain.enabled;
  const hasTreasuryView = manifest.features.treasuryView;
  const hasModuleView = modules.length > 1 || modules.some((module) => module.id !== "dao");
  const hasProposalCreation = manifest.features.proposalCreation;
  const availableViews: ActiveView[] = useMemo(() => [
    "overview",
    ...(hasProposalView ? ["proposals"] : []),
    ...(hasProposalCreation ? ["create-proposal"] : []),
    ...(hasTreasuryView ? ["treasury", "request-spend"] : []),
    ...(hasModuleView ? ["modules"] : []),
    "activity",
    "settings"
  ] as ActiveView[], [hasModuleView, hasProposalCreation, hasProposalView, hasTreasuryView]);
  const currentDetail = detailStack[detailStack.length - 1] ?? null;
  const governanceHeadline = manifest.governance.mode === "on-chain"
    ? "Direct Settlement Governance"
    : manifest.governance.mode === "off-chain"
      ? "Off-Chain Operations Governance"
      : "Hybrid Governance Workspace";
  const governanceSubtitle = manifest.governance.mode === "on-chain"
    ? "Every proposal, vote, and execution path settles directly against the chain configuration below."
    : manifest.governance.mode === "off-chain"
      ? "This release prioritizes fast organizational motions, policy approvals, and operator workflows before optional anchoring."
      : "This release blends hard-settlement treasury actions with faster off-chain operating motions and companion tools.";
  const offchainAuthLabels = manifest.governance.offchain.auth.map(formatAuthLabel);
  const metadataConfigured = !isPlaceholder(manifest.services.metadataBaseUrl);
  const supportConfigured = !isPlaceholder(manifest.support.website);

  useEffect(() => {
    if (!availableViews.includes(activeView)) {
      setActiveView("overview");
    }
  }, [activeView, availableViews]);

  useEffect(() => {
    if (!modules.some((module) => module.id === selectedModuleId) && primaryModule) {
      setSelectedModuleId(primaryModule.id);
    }
  }, [modules, primaryModule, selectedModuleId]);

  useEffect(() => {
    if (proposals.length > 0 && !proposals.some((proposal) => proposal.id === selectedProposalId)) {
      setSelectedProposalId(proposals[0].id);
    }
  }, [proposals, selectedProposalId]);

  useEffect(() => {
    if (motions.length > 0 && !motions.some((motion) => motion.id === selectedMotionId)) {
      setSelectedMotionId(motions[0].id);
    }
  }, [motions, selectedMotionId]);

  useEffect(() => {
    if (workspaceItems.length > 0 && !workspaceItems.some((item) => item.id === selectedWorkspaceId)) {
      setSelectedWorkspaceId(workspaceItems[0].id);
    }
  }, [workspaceItems, selectedWorkspaceId]);

  useEffect(() => {
    if (treasuryMovements.length > 0 && !treasuryMovements.some((movement) => movement.id === selectedMovementId)) {
      setSelectedMovementId(treasuryMovements[0].id);
    }
  }, [treasuryMovements, selectedMovementId]);

  function getWorkspaceModuleTitle() {
    return (workspaceModule ?? selectedModule)?.title ?? "Workspace";
  }

  function openDetail(detail: DetailState) {
    setDetailStack((currentStack) => [...currentStack, detail]);
  }

  function closeDetail() {
    setDetailStack((currentStack) => currentStack.slice(0, -1));
  }

  function jumpToDetail(index: number) {
    setDetailStack((currentStack) => currentStack.slice(0, index + 1));
  }

  function openView(view: ActiveView) {
    setDetailStack([]);
    setActiveView(view);
  }

  function getViewDescriptor(view: ActiveView): ViewDescriptor {
    if (view === "proposals") {
      return {
        eyebrow: "Route",
        title: "Governance Feed",
        subtitle: "Review treasury proposals and hybrid motions in one routed surface."
      };
    }

    if (view === "create-proposal") {
      return {
        eyebrow: "Route",
        title: "New Proposal",
        subtitle: "Draft and submit a governance proposal. Requires an active member session."
      };
    }

    if (view === "treasury") {
      return {
        eyebrow: "Route",
        title: "Treasury & Safety",
        subtitle: "Track balances, spending caps, recent movements, and the emergency guardian posture in one place."
      };
    }

    if (view === "modules") {
      return {
        eyebrow: "Route",
        title: "Companion Modules",
        subtitle: "Jump into documents, chat, analytics, and workspace operations from the same member client."
      };
    }

    if (view === "request-spend") {
      return {
        eyebrow: "Route",
        title: "Spend Request",
        subtitle: "Submit a treasury spend request. Requires an active member session. Capped at 25 ETH per transfer."
      };
    }

    if (view === "activity") {
      return {
        eyebrow: "Route",
        title: "Activity Log",
        subtitle: "Full governance audit trail — proposals, votes, motions, treasury, and guardian events."
      };
    }

    if (view === "settings") {
      return {
        eyebrow: "Route",
        title: "Release Controls",
        subtitle: "Validate support, metadata, and distribution settings before pushing the next build."
      };
    }

    return {
      eyebrow: "Route",
      title: "Overview Board",
      subtitle: "See release readiness, access posture, and governance mode at a glance."
    };
  }

  function getRouteSignals(view: ActiveView): RouteSignal[] {
    if (view === "create-proposal") {
      return [
        { label: "Required fields", value: "Title, Summary", tone: "neutral" },
        { label: "Optional fields", value: "Doc URI, Doc Hash", tone: "neutral" },
        { label: "Settlement", value: "FIXTURE TX (until on-chain)", tone: "warning" }
      ];
    }

    if (view === "proposals") {
      const queuedCount = proposals.filter((proposal) => proposal.state === "Queued").length;

      return [
        { label: "On-chain proposals", value: String(proposals.length), tone: proposals.length > 0 ? "good" : "neutral" },
        { label: "Queued items", value: String(queuedCount), tone: queuedCount > 0 ? "warning" : "neutral" },
        { label: "Off-chain motions", value: manifest.governance.offchain.enabled ? String(motions.length) : "Disabled", tone: manifest.governance.offchain.enabled ? "good" : "neutral" }
      ];
    }

    if (view === "treasury") {
      const queuedMovementCount = treasuryMovements.filter((movement) => movement.status === "Queued").length;
      const pendingGuardianCount = guardianEvents.filter((event) => event.status === "Pending").length;

      return [
        { label: "Treasury balance", value: treasury.balance, tone: "good" },
        { label: "Queued movements", value: String(queuedMovementCount), tone: queuedMovementCount > 0 ? "warning" : "neutral" },
        { label: "Guardian state", value: treasury.paused ? "Paused" : guardian.state, tone: treasury.paused ? "warning" : pendingGuardianCount > 0 ? "warning" : "good" }
      ];
    }

    if (view === "modules") {
      const readyWorkspaceCount = workspaceItems.filter((item) => item.status === "Ready").length;
      const gatedModules = modules.filter((module) => module.requiresAuth).length;

      return [
        { label: "Enabled modules", value: String(modules.length), tone: modules.length > 0 ? "good" : "warning" },
        { label: "Protected routes", value: String(gatedModules), tone: gatedModules > 0 ? "good" : "neutral" },
        { label: "Ready workspace items", value: String(readyWorkspaceCount), tone: readyWorkspaceCount > 0 ? "good" : "neutral" }
      ];
    }

    if (view === "request-spend") {
      return [
        { label: "Per-transfer cap", value: treasury.perTransferCap, tone: "neutral" },
        { label: "Daily cap", value: treasury.dailyCap, tone: "neutral" },
        { label: "Treasury status", value: treasury.paused ? "Paused" : "Active", tone: treasury.paused ? "warning" : "good" }
      ];
    }

    if (view === "activity") {
      return [
        { label: "Total events", value: "12", tone: "good" },
        { label: "Vote events", value: "4", tone: "good" },
        { label: "Proposal events", value: "2", tone: "neutral" }
      ];
    }

    if (view === "settings") {
      return [
        { label: "Manifest warnings", value: String(warnings.length), tone: warnings.length > 0 ? "warning" : "good" },
        { label: "Hosted services", value: String(manifest.app.distribution.hostedServices.length), tone: manifest.app.distribution.hostedServices.length > 0 ? "good" : "neutral" },
        { label: "Track", value: manifest.release.android.track, tone: "neutral" }
      ];
    }

    return [
      { label: "Governance mode", value: manifest.governance.mode, tone: "good" },
      { label: "Warnings", value: String(warnings.length), tone: warnings.length > 0 ? "warning" : "good" },
      { label: "Live modules", value: String(modules.length), tone: modules.length > 0 ? "good" : "neutral" }
    ];
  }

  function getLaunchpadActions(): LaunchpadAction[] {
    const actions: LaunchpadAction[] = [];

    if (hasProposalView) {
      actions.push({
        label: "Open Governance Feed",
        subtitle: manifest.governance.offchain.enabled ? "Review proposals and operating motions together" : "Review on-chain proposals and execution timing",
        view: "proposals"
      });
    }

    if (hasTreasuryView) {
      actions.push({
        label: "Open Treasury & Safety",
        subtitle: "Review balances, spending caps, movements, and emergency guardian status",
        view: "treasury"
      });
    }

    if (hasModuleView) {
      actions.push({
        label: "Browse Modules",
        subtitle: "Inspect workspace routes, auth requirements, and module launch surfaces",
        view: "modules"
      });
    }

    actions.push({
      label: "Check Release Controls",
      subtitle: "Confirm manifest, support, and distribution settings before shipping",
      view: "settings"
    });

    return actions;
  }

  function getDetailActions(detail: DetailState): DetailAction[] {
    if (detail.kind === "proposal") {
      return [
        { label: "Review Modules", view: "modules", secondary: true },
        { label: "Check Release Settings", view: "settings" }
      ];
    }

    if (detail.kind === "motion") {
      return [
        { label: "Back To Proposals", view: "proposals", secondary: true },
        { label: "Open Release Settings", view: "settings" }
      ];
    }

    if (detail.kind === "module") {
      return [
        { label: "Inspect Workspace Queue", view: "modules", secondary: true },
        { label: "Review Access Settings", view: "settings" }
      ];
    }

    if (detail.kind === "treasury") {
      return [
        { label: "Back To Treasury", view: "treasury", secondary: true },
        { label: "Open Governance Feed", view: "proposals" }
      ];
    }

    if (detail.kind === "guardian") {
      return [
        { label: "Back To Treasury", view: "treasury", secondary: true },
        { label: "Check Release Settings", view: "settings" }
      ];
    }

    return [
      { label: "Open Modules", view: "modules", secondary: true },
      { label: "Check Release Settings", view: "settings" }
    ];
  }

  function getRelatedDetails(detail: DetailState): RelatedDetailAction[] {
    if (detail.kind === "proposal") {
      const relatedModule = selectedModule ?? primaryModule;
      const relatedWorkspace = workspaceItems.find((item) => item.id === selectedWorkspaceId) ?? workspaceItems[0];

      return [
        ...(relatedModule ? [{ label: `Open ${relatedModule.title}`, detail: buildModuleDetail(relatedModule, manifest) }] : []),
        ...(relatedWorkspace ? [{ label: `Inspect ${relatedWorkspace.id}`, detail: buildWorkspaceDetail(relatedWorkspace, getWorkspaceModuleTitle()) }] : [])
      ];
    }

    if (detail.kind === "motion") {
      const relatedProposal = proposals.find((proposal) => proposal.id === selectedProposalId) ?? proposals[0];
      return relatedProposal ? [{ label: `Anchor Into ${relatedProposal.id}`, detail: buildProposalDetail(relatedProposal) }] : [];
    }

    if (detail.kind === "module") {
      const relatedWorkspace = workspaceItems.find((item) => item.id === selectedWorkspaceId) ?? workspaceItems[0];
      const relatedMotion = motions.find((motion) => motion.id === selectedMotionId) ?? motions[0];

      return [
        ...(relatedWorkspace ? [{ label: `Open ${relatedWorkspace.id}`, detail: buildWorkspaceDetail(relatedWorkspace, getWorkspaceModuleTitle()) }] : []),
        ...(manifest.governance.offchain.enabled && relatedMotion ? [{ label: `Review ${relatedMotion.id}`, detail: buildMotionDetail(relatedMotion, manifest) }] : [])
      ];
    }

    if (detail.kind === "treasury") {
      const relatedProposal = proposals.find((proposal) => proposal.id === selectedProposalId) ?? proposals[0];
      const relatedGuardianEvent = guardianEvents[0];

      return [
        ...(relatedProposal ? [{ label: `Review ${relatedProposal.id}`, detail: buildProposalDetail(relatedProposal) }] : []),
        ...(relatedGuardianEvent ? [{ label: `Inspect ${relatedGuardianEvent.id}`, detail: buildGuardianEventDetail(relatedGuardianEvent, guardian) }] : [])
      ];
    }

    if (detail.kind === "guardian") {
      const relatedMovement = treasuryMovements.find((movement) => movement.id === selectedMovementId) ?? treasuryMovements[0];
      const relatedWorkspace = workspaceItems.find((item) => item.type.toLowerCase().includes("runbook")) ?? workspaceItems[0];

      return [
        ...(relatedMovement ? [{ label: `Trace ${relatedMovement.id}`, detail: buildTreasuryMovementDetail(relatedMovement, treasury.custodian) }] : []),
        ...(relatedWorkspace ? [{ label: `Open ${relatedWorkspace.id}`, detail: buildWorkspaceDetail(relatedWorkspace, getWorkspaceModuleTitle()) }] : [])
      ];
    }

    const relatedModule = selectedModule ?? workspaceModule;
    const relatedProposal = proposals.find((proposal) => proposal.id === selectedProposalId) ?? proposals[0];

    return [
      ...(relatedModule ? [{ label: `Open ${relatedModule.title}`, detail: buildModuleDetail(relatedModule, manifest) }] : []),
      ...(relatedProposal ? [{ label: `Review ${relatedProposal.id}`, detail: buildProposalDetail(relatedProposal) }] : [])
    ];
  }

  function openProposal(proposal: (typeof proposals)[number]) {
    setSelectedProposalId(proposal.id);
    openDetail(buildProposalDetail(proposal));
  }

  function openMotion(motion: (typeof motions)[number]) {
    setSelectedMotionId(motion.id);
    openDetail(buildMotionDetail(motion, manifest));
  }

  function openModule(module: ModuleItem) {
    setSelectedModuleId(module.id);
    openDetail(buildModuleDetail(module, manifest));
  }

  function openWorkspace(item: (typeof workspaceItems)[number]) {
    setSelectedWorkspaceId(item.id);
    openDetail(buildWorkspaceDetail(item, getWorkspaceModuleTitle()));
  }

  function openTreasuryMovement(movement: (typeof treasuryMovements)[number]) {
    setSelectedMovementId(movement.id);
    openDetail(buildTreasuryMovementDetail(movement, treasury.custodian));
  }

  function openGuardianEvent(event: (typeof guardianEvents)[number]) {
    openDetail(buildGuardianEventDetail(event, guardian));
  }

  function openMember(member: (typeof members)[number]) {
    openDetail(buildMemberDetail(member));
  }

  function openCreateProposal() {
    setDetailStack([]);
    setActiveView("create-proposal");
  }

  function closeCreateProposal() {
    setActiveView("proposals");
  }

  function openRequestSpend() {
    setDetailStack([]);
    setActiveView("request-spend");
  }

  function closeRequestSpend() {
    setActiveView("treasury");
  }

  return {
    activeView,
    availableViews,
    currentDetail,
    dashboardData,
    dashboardLoading,
    detailActions: currentDetail ? getDetailActions(currentDetail) : [],
    detailStack,
    governanceHeadline,
    governanceSubtitle,
    guardian,
    guardianEvents,
    hasModuleView,
    hasProposalCreation,
    hasProposalView,
    hasTreasuryView,
    launchpadActions: getLaunchpadActions(),
    members,
    metadataConfigured,
    modules,
    motions,
    offchainAuthLabels,
    onchainReady,
    proposals,
    refreshDashboard,
    relatedDetails: currentDetail ? getRelatedDetails(currentDetail) : [],
    routeDescriptor: getViewDescriptor(activeView),
    routeSignals: getRouteSignals(activeView),
    selectedModule,
    supportConfigured,
    treasury,
    treasuryMovements,
    warnings,
    workspaceItems,
    workspaceModule,
    closeDetail,
    closeCreateProposal,
    closeRequestSpend,
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
    openRequestSpend
  };
}
