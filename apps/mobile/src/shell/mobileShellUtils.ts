import { MotionItem, ProposalItem, WorkspaceItem } from "../data/mobileDataSource";
import { ActiveView, DetailState } from "../shellTypes";
import { AppManifest } from "../types";

export type ModuleItem = AppManifest["experiences"]["modules"][number];

export interface ViewDescriptor {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export interface RouteSignal {
  label: string;
  value: string;
  tone?: "good" | "warning" | "neutral";
}

export interface LaunchpadAction {
  label: string;
  subtitle: string;
  view: ActiveView;
}

export interface DetailAction {
  label: string;
  view: ActiveView;
  secondary?: boolean;
}

export interface RelatedDetailAction {
  label: string;
  detail: DetailState;
}

export function isPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("example.") || normalized.includes("your_") || /^0x0{40}$/i.test(normalized);
}

export function formatAuthLabel(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function deriveWarnings(appManifest: AppManifest): string[] {
  const warnings: string[] = [];

  if (isPlaceholder(appManifest.chain.rpcUrl)) {
    warnings.push("RPC endpoint is still a placeholder.");
  }

  if (Object.values(appManifest.contracts).some((address) => isPlaceholder(address))) {
    warnings.push("One or more contract addresses still use zero-address placeholders.");
  }

  if (isPlaceholder(appManifest.services.metadataBaseUrl) || isPlaceholder(appManifest.services.indexerBaseUrl)) {
    warnings.push("Hosted service endpoints need production values before store review.");
  }

  if (appManifest.governance.offchain.enabled && isPlaceholder(appManifest.governance.offchain.apiBaseUrl)) {
    warnings.push("Off-chain governance API is still pointed at a placeholder domain.");
  }

  return warnings;
}

export function getModuleNarrative(module: ModuleItem | undefined, legalName: string) {
  if (!module) {
    return {
      title: "No active module",
      summary: "Enable at least one module to shape the member app experience.",
      owner: legalName,
      nextStep: "Update the manifest module list"
    };
  }

  if (module.kind === "documents") {
    return {
      title: `${module.title} review pipeline`,
      summary: "Document rooms keep policies, treasury narratives, and working drafts close to governance instead of splitting them into another product.",
      owner: "Operations Workspace",
      nextStep: "Wire document APIs and reviewer identities for launch"
    };
  }

  if (module.kind === "chat") {
    return {
      title: `${module.title} collaboration loop`,
      summary: "Conversation modules keep deliberation and follow-up close to the governance timeline.",
      owner: "Community Ops",
      nextStep: "Connect moderation and notification rules"
    };
  }

  if (module.kind === "analytics") {
    return {
      title: `${module.title} insights layer`,
      summary: "Analytics modules explain participation and treasury activity without forcing users into a separate dashboard.",
      owner: "Control Plane",
      nextStep: "Promote production analytics endpoints"
    };
  }

  return {
    title: `${module.title} operating surface`,
    summary: "Companion modules broaden the app beyond proposals so organizations can keep execution, review, and support in one member surface.",
    owner: "Product Operations",
    nextStep: "Complete backend route integration for this module"
  };
}

export function buildProposalDetail(proposal: ProposalItem): DetailState {
  return {
    refId: proposal.id,
    kind: "proposal",
    eyebrow: "Proposal Detail",
    title: proposal.title,
    summary: proposal.summary,
    owner: proposal.owner,
    nextStep: proposal.nextStep,
    meta: [`State ${proposal.state}`, `Source ${proposal.source}`, `ETA ${proposal.eta}`]
  };
}

export function buildMotionDetail(motion: MotionItem, manifest: AppManifest): DetailState {
  return {
    refId: motion.id,
    kind: "motion",
    eyebrow: "Motion Detail",
    title: motion.title,
    summary: motion.summary,
    owner: motion.owner,
    nextStep: motion.nextStep,
    tone: "graphite",
    meta: [`Stage ${motion.stage}`, `Auth ${motion.auth}`, `Mode ${manifest.governance.mode}`]
  };
}

export function buildModuleDetail(module: ModuleItem, manifest: AppManifest): DetailState {
  const narrative = getModuleNarrative(module, manifest.support.legalName);

  return {
    refId: module.id,
    kind: "module",
    eyebrow: "Module Detail",
    title: narrative.title,
    summary: narrative.summary,
    owner: narrative.owner,
    nextStep: narrative.nextStep,
    meta: [`Kind ${module.kind}`, `Route ${module.entryRoute}`, `Auth ${module.requiresAuth ? "Required" : "Guest"}`]
  };
}

export function buildWorkspaceDetail(item: WorkspaceItem, moduleTitle: string): DetailState {
  return {
    refId: item.id,
    kind: "workspace",
    eyebrow: "Workspace Detail",
    title: item.title,
    summary: `${item.type} inside ${moduleTitle}.`,
    owner: item.owner,
    nextStep: item.nextStep,
    meta: [`Status ${item.status}`, `Type ${item.type}`, `Module ${moduleTitle}`]
  };
}
