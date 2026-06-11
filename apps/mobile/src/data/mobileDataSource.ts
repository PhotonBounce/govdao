import { AppManifest } from "../types";
import {
  guardianEvents,
  guardianStatus,
  memberRoster,
  offchainMotions,
  proposalFeed,
  treasuryMovements,
  treasurySnapshot,
  workspaceItems
} from "./mockState";

export type ProposalItem = (typeof proposalFeed)[number];
export type MotionItem = (typeof offchainMotions)[number];
export type WorkspaceItem = (typeof workspaceItems)[number];
export type TreasurySnapshot = typeof treasurySnapshot;
export type TreasuryMovementItem = (typeof treasuryMovements)[number];
export type GuardianStatus = typeof guardianStatus;
export type GuardianEventItem = (typeof guardianEvents)[number];
export type MemberItem = (typeof memberRoster)[number];
export type MobileDashboardSource = "mock" | "remote" | "fixture" | "mixed";
export type DashboardEndpointState = "live" | "fixture" | "fallback" | "disabled";
export type DashboardEndpointTransport = "remote" | "fixture" | "preview" | "disabled";

const REQUEST_TIMEOUT_MS = 4000;
const FIXTURE_SCHEME = "fixture://";

type DashboardTransport = "remote" | "fixture";

interface DashboardFetchResult<T> {
  payload: T;
  transport: DashboardTransport;
}

const fixturePayloads: Record<string, unknown> = {
  "fixture://govdao/mobile/proposals": {
    proposals: [
      {
        proposalId: "GOV-201",
        name: "Ratify release operations checklist",
        status: "Voting",
        origin: "Hybrid",
        deadline: "18h",
        description: "Confirms the member-facing release checklist before expanding the internal-track pilot.",
        sponsor: "Release Council",
        recommendedAction: "Collect final delegate approvals and publish the release note set",
        proposalIndex: 7,
        documentUri: "fixture://govdao/docs/gov-201",
        documentHash: "0xbfe372799f3fe4fa780c8eff6fc21dedcf34b182702379ba80f94d4cc15d6cf8"
      },
      {
        proposalId: "GOV-202",
        name: "Raise guardian drill cadence",
        status: "Queued",
        origin: "On-chain",
        executionEta: "6h",
        description: "Moves the emergency response rehearsal from quarterly to monthly with expanded signer coverage.",
        sponsor: "Security Operations",
        recommendedAction: "Wait for timelock expiry and executor confirmation",
        proposalIndex: 8,
        documentUri: "fixture://govdao/docs/gov-202",
        documentHash: "0x14dc142eafadaf58657e4d35121ff52fe28eb202ed00de8d5a76bea0f835a40d"
      }
    ]
  },
  "fixture://govdao/mobile/motions": {
    motions: [
      {
        motionId: "OPS-31",
        name: "Approve translated onboarding pack",
        status: "Delegate Review",
        authMethod: "Passkey",
        description: "Localizes member onboarding and support materials before public rollout.",
        team: "Member Success",
        recommendedAction: "Anchor the approved translation bundle into the next governance brief"
      },
      {
        motionId: "OPS-33",
        name: "Pilot regional ambassador workspace",
        status: "Ops Review",
        authMethod: "Wallet Signature",
        description: "Tests a lightweight regional workspace flow before expanding module access.",
        team: "Community Operations",
        recommendedAction: "Route the pilot summary into workspace approvals"
      }
    ]
  },
  "fixture://govdao/mobile/treasury": {
    summary: {
      custodianName: "Treasury Timelock",
      totalBalance: "131.9 ETH",
      transferCap: "25 ETH",
      dailyLimit: "60 ETH",
      isPaused: false,
      window: "Last 30 days"
    },
    movements: [
      {
        movementId: "TRX-102",
        name: "Release operations retainer",
        flow: "Outflow",
        value: "9.8 ETH",
        state: "Executed",
        counterpartyName: "Release Council Safe",
        recommendedAction: "Publish the execution receipt with the next treasury report"
      },
      {
        movementId: "TRX-104",
        name: "Hosted services revenue sweep",
        flow: "Inflow",
        value: "6.2 ETH",
        state: "Settled",
        counterpartyName: "Subscription Collector",
        recommendedAction: "Reconcile against the hosted-services invoice ledger"
      },
      {
        movementId: "TRX-107",
        name: "Guardian tooling grant",
        flow: "Outflow",
        value: "5.0 ETH",
        state: "Queued",
        counterpartyName: "Security Tooling Vendor",
        recommendedAction: "Wait for timelock release before executor confirmation"
      }
    ]
  },
  "fixture://govdao/mobile/guardian": {
    guardian: {
      mode: "Standby",
      signerThreshold: "3-of-5",
      signerCount: "5 active signers",
      activePause: "No active pause",
      drillSummary: "Monthly drill completed 6d ago"
    },
    events: [
      {
        eventId: "GRD-21",
        name: "Monthly pause rehearsal",
        level: "Routine",
        state: "Completed",
        team: "Security Desk",
        recommendedAction: "Attach the rehearsal notes to the incident runbook"
      },
      {
        eventId: "GRD-23",
        name: "Signer coverage expansion",
        level: "Elevated",
        state: "Pending",
        team: "Security Council",
        recommendedAction: "Collect remaining signatures before rotating the signer set"
      }
    ]
  },
  "fixture://govdao/mobile/workspace": {
    workspace: [
      {
        itemId: "DOC-18",
        name: "Incident communications runbook",
        kind: "Runbook",
        assignee: "Security Desk",
        stage: "Ready",
        recommendedAction: "Attach the latest drill notes and publish to guardians"
      },
      {
        itemId: "ANA-11",
        name: "Delegate participation digest",
        kind: "Analytics Snapshot",
        assignee: "Control Plane",
        stage: "Needs Review",
        recommendedAction: "Share the digest with governance leads before the next voting window"
      }
    ]
  },
  "fixture://govdao/mobile/members": {
    members: [
      {
        memberId: "MBR-201",
        displayName: "Governance Steward",
        walletAddress: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b",
        memberRole: "On-chain Governor",
        state: "Active",
        joinDate: "2024-01-10"
      },
      {
        memberId: "MBR-202",
        displayName: "Treasury Custodian",
        walletAddress: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
        memberRole: "Finance Delegate",
        state: "Active",
        joinDate: "2024-02-14"
      },
      {
        memberId: "MBR-203",
        displayName: "Community Ambassador",
        walletAddress: "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c",
        memberRole: "Regional Delegate",
        state: "Active",
        joinDate: "2024-05-20"
      },
      {
        memberId: "MBR-204",
        displayName: "Security Desk Lead",
        walletAddress: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d",
        memberRole: "Guardian Delegate",
        state: "Active",
        joinDate: "2024-03-08"
      }
    ]
  }
};

export interface DashboardEndpointStatus {
  label: string;
  state: DashboardEndpointState;
  transport: DashboardEndpointTransport;
  url: string | null;
  detail: string;
}

export interface MobileDashboardData {
  proposals: ProposalItem[];
  motions: MotionItem[];
  workspaceItems: WorkspaceItem[];
  treasury: TreasurySnapshot;
  treasuryMovements: TreasuryMovementItem[];
  guardian: GuardianStatus;
  guardianEvents: GuardianEventItem[];
  members: MemberItem[];
  source: MobileDashboardSource;
  syncMessage: string;
  lastUpdatedAt: string;
  endpoints: DashboardEndpointStatus[];
}

interface ResolvedDashboardEndpoints {
  proposalsUrl: string;
  proposalsSourceLabel: string;
  motionsUrl: string | null;
  motionsSourceLabel: string;
  treasuryUrl: string | null;
  treasurySourceLabel: string;
  guardianUrl: string;
  guardianSourceLabel: string;
  workspaceUrl: string;
  workspaceSourceLabel: string;
  membersUrl: string;
  membersSourceLabel: string;
}

function isPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("example.") || normalized.includes("your_") || /^0x0{40}$/i.test(normalized);
}

function isFixtureUrl(value: string): boolean {
  return value.trim().toLowerCase().startsWith(FIXTURE_SCHEME);
}

function getTimestamp(): string {
  return new Date().toISOString();
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function buildMockDashboardData(reason: string): MobileDashboardData {
  return {
    proposals: proposalFeed,
    motions: offchainMotions,
    workspaceItems,
    treasury: treasurySnapshot,
    treasuryMovements,
    guardian: guardianStatus,
    guardianEvents,
    members: memberRoster,
    source: "mock",
    syncMessage: reason,
    lastUpdatedAt: getTimestamp(),
    endpoints: [
      { label: "Proposals", state: "fallback", transport: "preview", url: null, detail: "Using preview proposal feed." },
      { label: "Motions", state: "fallback", transport: "preview", url: null, detail: "Using preview motion queue." },
      { label: "Treasury", state: "fallback", transport: "preview", url: null, detail: "Using preview treasury snapshot." },
      { label: "Guardian", state: "fallback", transport: "preview", url: null, detail: "Using preview guardian status." },
      { label: "Workspace", state: "fallback", transport: "preview", url: null, detail: "Using preview workspace queue." },
      { label: "Members", state: "fallback", transport: "preview", url: null, detail: "Using preview member roster." }
    ]
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "An unexpected dashboard error occurred.";
}

export function buildDashboardRecoveryData(previousData: MobileDashboardData | null, error: unknown): MobileDashboardData {
  const message = getErrorMessage(error);

  if (!previousData || previousData.source === "mock") {
    return buildMockDashboardData(`Using local preview data because the dashboard refresh failed: ${message}`);
  }

  return {
    ...previousData,
    source: "mixed",
    syncMessage: `Showing last known dashboard data because refresh failed: ${message}`,
    endpoints: previousData.endpoints.map((endpoint) => ({
      ...endpoint,
      state: endpoint.state === "disabled" ? "disabled" : "fallback",
      detail: endpoint.state === "disabled"
        ? endpoint.detail
        : `${endpoint.detail} Last known data preserved after refresh failure.`
    }))
  };
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

function ensureLeadingSlash(value: string): string {
  return value.startsWith("/") ? value : `/${value}`;
}

function joinUrl(baseUrl: string, routePath: string): string {
  return `${trimTrailingSlash(baseUrl)}${ensureLeadingSlash(routePath)}`;
}

function getModuleApiBaseUrl(manifest: AppManifest, predicate: (module: AppManifest["experiences"]["modules"][number]) => boolean): string | null {
  const module = manifest.experiences.modules.find((candidate) => candidate.enabled && predicate(candidate));

  if (!module || isPlaceholder(module.apiBaseUrl)) {
    return null;
  }

  return trimTrailingSlash(module.apiBaseUrl);
}

function describeSourceLabel(baseUrl: string, fallbackLabel: string): string {
  return isFixtureUrl(baseUrl) ? "Fixture feed" : fallbackLabel;
}

function resolveDashboardEndpoints(manifest: AppManifest): ResolvedDashboardEndpoints {
  const proposalModuleBaseUrl = getModuleApiBaseUrl(manifest, (module) => module.kind === "dao" || module.id === manifest.experiences.primaryModuleId);
  const workspaceModuleBaseUrl = getModuleApiBaseUrl(manifest, (module) => module.kind !== "dao");
  const proposalServiceBaseUrl = trimTrailingSlash(manifest.services.indexerBaseUrl);
  const workspaceServiceBaseUrl = trimTrailingSlash(manifest.services.metadataBaseUrl);
  const motionServiceBaseUrl = trimTrailingSlash(manifest.governance.offchain.apiBaseUrl);
  const onchainBaseUrl = proposalModuleBaseUrl ?? proposalServiceBaseUrl;
  const onchainSourceLabel = (fallbackLabel: string) => describeSourceLabel(onchainBaseUrl, proposalModuleBaseUrl ? "DAO module API" : fallbackLabel);

  return {
    proposalsUrl: joinUrl(onchainBaseUrl, manifest.services.mobileFeeds.proposalsPath),
    proposalsSourceLabel: onchainSourceLabel("Indexer service"),
    motionsUrl: manifest.governance.offchain.enabled ? joinUrl(motionServiceBaseUrl, manifest.services.mobileFeeds.motionsPath) : null,
    motionsSourceLabel: manifest.governance.offchain.enabled ? describeSourceLabel(motionServiceBaseUrl, "Off-chain governance API") : "Off-chain governance disabled",
    treasuryUrl: manifest.features.treasuryView ? joinUrl(onchainBaseUrl, manifest.services.mobileFeeds.treasuryPath) : null,
    treasurySourceLabel: manifest.features.treasuryView ? onchainSourceLabel("Indexer service") : "Treasury view disabled",
    guardianUrl: joinUrl(onchainBaseUrl, manifest.services.mobileFeeds.guardianPath),
    guardianSourceLabel: onchainSourceLabel("Indexer service"),
    workspaceUrl: joinUrl(workspaceModuleBaseUrl ?? workspaceServiceBaseUrl, manifest.services.mobileFeeds.workspacePath),
    workspaceSourceLabel: describeSourceLabel(workspaceModuleBaseUrl ?? workspaceServiceBaseUrl, workspaceModuleBaseUrl ? "Workspace module API" : "Metadata service"),
    membersUrl: joinUrl(onchainBaseUrl, manifest.services.mobileFeeds.membersPath),
    membersSourceLabel: onchainSourceLabel("Indexer service")
  };
}

function getFixturePayload(url: string): unknown | null {
  return fixturePayloads[url.toLowerCase()] ?? null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const response = await fetch(url, { signal: controller.signal }).catch((error: unknown) => {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms for ${url}`);
    }

    throw error;
  }).finally(() => {
    clearTimeout(timeoutHandle);
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status} for ${url}`);
  }

  return response.json() as Promise<T>;
}

async function fetchDashboardPayload<T>(url: string): Promise<DashboardFetchResult<T>> {
  const fixturePayload = getFixturePayload(url);

  if (fixturePayload !== null) {
    return {
      payload: cloneJson(fixturePayload) as T,
      transport: "fixture"
    };
  }

  return {
    payload: await fetchJson<T>(url),
    transport: "remote"
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function extractRecord(payload: unknown, candidateKeys: string[]): Record<string, unknown> | null {
  const record = asRecord(payload);

  if (!record) {
    return null;
  }

  for (const key of candidateKeys) {
    const candidate = asRecord(record[key]);
    if (candidate) {
      return candidate;
    }
  }

  return record;
}

function extractCollection(payload: unknown, candidateKeys: string[]): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = asRecord(payload);

  if (!record) {
    return [];
  }

  for (const key of candidateKeys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  for (const candidate of Object.values(record)) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function normalizeProposalItem(value: unknown, index: number): ProposalItem {
  const fallback = proposalFeed[index % proposalFeed.length];
  const record = asRecord(value);

  if (!record) {
    return fallback;
  }

  return {
    id: readString(record.id ?? record.proposalId ?? record.slug, fallback.id),
    title: readString(record.title ?? record.name, fallback.title),
    state: readString(record.state ?? record.status, fallback.state),
    source: readString(record.source ?? record.mode ?? record.origin, fallback.source),
    eta: readString(record.eta ?? record.executionEta ?? record.deadline, fallback.eta),
    summary: readString(record.summary ?? record.description, fallback.summary),
    owner: readString(record.owner ?? record.sponsor ?? record.author, fallback.owner),
    nextStep: readString(record.nextStep ?? record.next_action ?? record.recommendedAction, fallback.nextStep),
    onchainId: readString(String(record.onchainId ?? record.proposalIndex ?? record.chainProposalId ?? ""), fallback.onchainId),
    docUri: readString(record.docUri ?? record.documentUri ?? record.metadataURI, fallback.docUri),
    docHash: readString(record.docHash ?? record.documentHash ?? record.metadataHash, fallback.docHash)
  };
}

function normalizeMotionItem(value: unknown, index: number): MotionItem {
  const fallback = offchainMotions[index % offchainMotions.length];
  const record = asRecord(value);

  if (!record) {
    return fallback;
  }

  return {
    id: readString(record.id ?? record.motionId ?? record.slug, fallback.id),
    title: readString(record.title ?? record.name, fallback.title),
    stage: readString(record.stage ?? record.status, fallback.stage),
    auth: readString(record.auth ?? record.authMethod ?? record.authentication, fallback.auth),
    summary: readString(record.summary ?? record.description, fallback.summary),
    owner: readString(record.owner ?? record.team ?? record.author, fallback.owner),
    nextStep: readString(record.nextStep ?? record.next_action ?? record.recommendedAction, fallback.nextStep)
  };
}

function normalizeWorkspaceItem(value: unknown, index: number): WorkspaceItem {
  const fallback = workspaceItems[index % workspaceItems.length];
  const record = asRecord(value);

  if (!record) {
    return fallback;
  }

  return {
    id: readString(record.id ?? record.itemId ?? record.slug, fallback.id),
    title: readString(record.title ?? record.name, fallback.title),
    type: readString(record.type ?? record.kind, fallback.type),
    owner: readString(record.owner ?? record.team ?? record.assignee, fallback.owner),
    status: readString(record.status ?? record.stage, fallback.status),
    nextStep: readString(record.nextStep ?? record.next_action ?? record.recommendedAction, fallback.nextStep)
  };
}

function normalizeTreasurySnapshot(payload: unknown): TreasurySnapshot {
  const record = extractRecord(payload, ["summary", "treasury", "snapshot"]);

  if (!record) {
    return treasurySnapshot;
  }

  return {
    custodian: readString(record.custodian ?? record.custodianName ?? record.executor, treasurySnapshot.custodian),
    balance: readString(record.balance ?? record.totalBalance ?? record.holdings, treasurySnapshot.balance),
    perTransferCap: readString(record.perTransferCap ?? record.transferCap ?? record.maxTransfer, treasurySnapshot.perTransferCap),
    dailyCap: readString(record.dailyCap ?? record.dailyLimit ?? record.maxDaily, treasurySnapshot.dailyCap),
    paused: readBoolean(record.paused ?? record.isPaused, treasurySnapshot.paused),
    reportingWindow: readString(record.reportingWindow ?? record.window ?? record.period, treasurySnapshot.reportingWindow)
  };
}

function normalizeTreasuryMovement(value: unknown, index: number): TreasuryMovementItem {
  const fallback = treasuryMovements[index % treasuryMovements.length];
  const record = asRecord(value);

  if (!record) {
    return fallback;
  }

  return {
    id: readString(record.id ?? record.movementId ?? record.txId, fallback.id),
    title: readString(record.title ?? record.name, fallback.title),
    direction: readString(record.direction ?? record.flow ?? record.kind, fallback.direction),
    amount: readString(record.amount ?? record.value, fallback.amount),
    status: readString(record.status ?? record.state, fallback.status),
    counterparty: readString(record.counterparty ?? record.counterpartyName ?? record.recipient, fallback.counterparty),
    nextStep: readString(record.nextStep ?? record.next_action ?? record.recommendedAction, fallback.nextStep)
  };
}

function normalizeGuardianStatus(payload: unknown): GuardianStatus {
  const record = extractRecord(payload, ["guardian", "status", "summary"]);

  if (!record) {
    return guardianStatus;
  }

  return {
    state: readString(record.state ?? record.mode ?? record.phase, guardianStatus.state),
    threshold: readString(record.threshold ?? record.signerThreshold ?? record.quorum, guardianStatus.threshold),
    signers: readString(record.signers ?? record.signerCount ?? record.signerSet, guardianStatus.signers),
    pauseWindow: readString(record.pauseWindow ?? record.activePause ?? record.pauseStatus, guardianStatus.pauseWindow),
    lastDrill: readString(record.lastDrill ?? record.drillSummary ?? record.lastRehearsal, guardianStatus.lastDrill)
  };
}

function normalizeGuardianEvent(value: unknown, index: number): GuardianEventItem {
  const fallback = guardianEvents[index % guardianEvents.length];
  const record = asRecord(value);

  if (!record) {
    return fallback;
  }

  return {
    id: readString(record.id ?? record.eventId ?? record.slug, fallback.id),
    title: readString(record.title ?? record.name, fallback.title),
    severity: readString(record.severity ?? record.level, fallback.severity),
    status: readString(record.status ?? record.state, fallback.status),
    owner: readString(record.owner ?? record.team ?? record.author, fallback.owner),
    nextStep: readString(record.nextStep ?? record.next_action ?? record.recommendedAction, fallback.nextStep)
  };
}

function normalizeTreasuryMovementCollection(payload: unknown): TreasuryMovementItem[] {
  const items = extractCollection(payload, ["items", "data", "results", "movements", "transactions"]);
  return items.map(normalizeTreasuryMovement);
}

function normalizeGuardianEventCollection(payload: unknown): GuardianEventItem[] {
  const items = extractCollection(payload, ["items", "data", "results", "events", "incidents"]);
  return items.map(normalizeGuardianEvent);
}

function normalizeProposalCollection(payload: unknown): ProposalItem[] {
  const items = extractCollection(payload, ["items", "data", "results", "proposals"]);
  return items.map(normalizeProposalItem);
}

function normalizeMotionCollection(payload: unknown): MotionItem[] {
  const items = extractCollection(payload, ["items", "data", "results", "motions"]);
  return items.map(normalizeMotionItem);
}

function normalizeWorkspaceCollection(payload: unknown): WorkspaceItem[] {
  const items = extractCollection(payload, ["items", "data", "results", "workspace", "workspaces"]);
  return items.map(normalizeWorkspaceItem);
}

function normalizeMemberItem(value: unknown, index: number): MemberItem {
  const fallback = memberRoster[index % memberRoster.length];
  const record = asRecord(value);

  if (!record) {
    return fallback;
  }

  return {
    id: readString(record.id ?? record.memberId ?? record.slug, fallback.id),
    address: readString(record.address ?? record.walletAddress ?? record.wallet, fallback.address),
    displayName: readString(record.displayName ?? record.name ?? record.alias, fallback.displayName),
    role: readString(record.role ?? record.memberRole ?? record.type, fallback.role),
    status: readString(record.status ?? record.state ?? record.memberStatus, fallback.status),
    joinedAt: readString(record.joinedAt ?? record.joinDate ?? record.createdAt, fallback.joinedAt)
  };
}

function normalizeMemberCollection(payload: unknown): MemberItem[] {
  const items = extractCollection(payload, ["items", "data", "results", "members", "roster"]);
  return items.map(normalizeMemberItem);
}

function isUsableEndpointUrl(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return isFixtureUrl(value) || (!isPlaceholder(value) && value.startsWith("https://"));
}

function canUseConfiguredFeeds(resolvedEndpoints: ResolvedDashboardEndpoints, motionEnabled: boolean, treasuryEnabled: boolean): boolean {
  if (!isUsableEndpointUrl(resolvedEndpoints.proposalsUrl) || !isUsableEndpointUrl(resolvedEndpoints.workspaceUrl) || !isUsableEndpointUrl(resolvedEndpoints.guardianUrl) || !isUsableEndpointUrl(resolvedEndpoints.membersUrl)) {
    return false;
  }

  if (motionEnabled && !isUsableEndpointUrl(resolvedEndpoints.motionsUrl)) {
    return false;
  }

  if (treasuryEnabled && !isUsableEndpointUrl(resolvedEndpoints.treasuryUrl)) {
    return false;
  }

  return true;
}

export async function loadMobileDashboardData(manifest: AppManifest): Promise<MobileDashboardData> {
  const resolvedEndpoints = resolveDashboardEndpoints(manifest);
  const motionEnabled = manifest.governance.offchain.enabled;
  const treasuryEnabled = manifest.features.treasuryView;

  if (!canUseConfiguredFeeds(resolvedEndpoints, motionEnabled, treasuryEnabled)) {
    const previewData = buildMockDashboardData("Using local preview data until service endpoints are promoted.");
    return {
      ...previewData,
      endpoints: [
        { label: "Proposals", state: "fallback", transport: "preview", url: resolvedEndpoints.proposalsUrl, detail: `${resolvedEndpoints.proposalsSourceLabel} is still placeholder-backed.` },
        { label: "Motions", state: motionEnabled ? "fallback" : "disabled", transport: motionEnabled ? "preview" : "disabled", url: resolvedEndpoints.motionsUrl, detail: motionEnabled ? `${resolvedEndpoints.motionsSourceLabel} is still placeholder-backed.` : "Off-chain governance is disabled." },
        { label: "Treasury", state: treasuryEnabled ? "fallback" : "disabled", transport: treasuryEnabled ? "preview" : "disabled", url: resolvedEndpoints.treasuryUrl, detail: treasuryEnabled ? `${resolvedEndpoints.treasurySourceLabel} is still placeholder-backed.` : "Treasury view is disabled." },
        { label: "Guardian", state: "fallback", transport: "preview", url: resolvedEndpoints.guardianUrl, detail: `${resolvedEndpoints.guardianSourceLabel} is still placeholder-backed.` },
        { label: "Workspace", state: "fallback", transport: "preview", url: resolvedEndpoints.workspaceUrl, detail: `${resolvedEndpoints.workspaceSourceLabel} is still placeholder-backed.` },
        { label: "Members", state: "fallback", transport: "preview", url: resolvedEndpoints.membersUrl, detail: `${resolvedEndpoints.membersSourceLabel} is still placeholder-backed.` }
      ]
    };
  }

  const skippedFeed = Promise.resolve({ payload: [] as unknown, transport: "fixture" as const });
  const endpointResults = await Promise.allSettled([
    fetchDashboardPayload<unknown>(resolvedEndpoints.proposalsUrl),
    motionEnabled && resolvedEndpoints.motionsUrl
      ? fetchDashboardPayload<unknown>(resolvedEndpoints.motionsUrl)
      : skippedFeed,
    treasuryEnabled && resolvedEndpoints.treasuryUrl
      ? fetchDashboardPayload<unknown>(resolvedEndpoints.treasuryUrl)
      : skippedFeed,
    fetchDashboardPayload<unknown>(resolvedEndpoints.guardianUrl),
    fetchDashboardPayload<unknown>(resolvedEndpoints.workspaceUrl),
    fetchDashboardPayload<unknown>(resolvedEndpoints.membersUrl)
  ]);

  const failures: string[] = [];
  const proposalPayload = endpointResults[0];
  const motionPayload = endpointResults[1];
  const treasuryPayload = endpointResults[2];
  const guardianPayload = endpointResults[3];
  const workspacePayload = endpointResults[4];
  const membersPayload = endpointResults[5];

  const proposals = proposalPayload.status === "fulfilled"
    ? normalizeProposalCollection(proposalPayload.value.payload)
    : (failures.push("proposals"), proposalFeed);
  const motions = motionPayload.status === "fulfilled"
    ? normalizeMotionCollection(motionPayload.value.payload)
    : (motionEnabled ? failures.push("motions") : null, offchainMotions);
  const treasury = treasuryPayload.status === "fulfilled"
    ? normalizeTreasurySnapshot(treasuryPayload.value.payload)
    : (treasuryEnabled ? failures.push("treasury") : null, treasurySnapshot);
  const movements = treasuryPayload.status === "fulfilled" && treasuryEnabled
    ? normalizeTreasuryMovementCollection(treasuryPayload.value.payload)
    : treasuryMovements;
  const guardian = guardianPayload.status === "fulfilled"
    ? normalizeGuardianStatus(guardianPayload.value.payload)
    : (failures.push("guardian"), guardianStatus);
  const guardianEventList = guardianPayload.status === "fulfilled"
    ? normalizeGuardianEventCollection(guardianPayload.value.payload)
    : guardianEvents;
  const workspace = workspacePayload.status === "fulfilled"
    ? normalizeWorkspaceCollection(workspacePayload.value.payload)
    : (failures.push("workspace"), workspaceItems);
  const members = membersPayload.status === "fulfilled"
    ? normalizeMemberCollection(membersPayload.value.payload)
    : (failures.push("members"), memberRoster);
  const proposalTransport = proposalPayload.status === "fulfilled" ? proposalPayload.value.transport : null;
  const motionTransport = motionPayload.status === "fulfilled" ? motionPayload.value.transport : null;
  const treasuryTransport = treasuryPayload.status === "fulfilled" ? treasuryPayload.value.transport : null;
  const guardianTransport = guardianPayload.status === "fulfilled" ? guardianPayload.value.transport : null;
  const workspaceTransport = workspacePayload.status === "fulfilled" ? workspacePayload.value.transport : null;
  const membersTransport = membersPayload.status === "fulfilled" ? membersPayload.value.transport : null;

  const timestamp = getTimestamp();
  const endpoints: DashboardEndpointStatus[] = [
    {
      label: "Proposals",
      state: proposalPayload.status === "fulfilled" ? proposalTransport === "fixture" ? "fixture" : "live" : "fallback",
      transport: proposalPayload.status === "fulfilled" ? proposalTransport ?? "remote" : "preview",
      url: resolvedEndpoints.proposalsUrl,
      detail: proposalPayload.status === "fulfilled"
        ? `Loaded ${proposals.length} proposal records from ${resolvedEndpoints.proposalsSourceLabel.toLowerCase()}.`
        : `Using preview proposal feed because ${resolvedEndpoints.proposalsSourceLabel.toLowerCase()} failed at ${resolvedEndpoints.proposalsUrl}.`
    },
    {
      label: "Motions",
      state: !motionEnabled ? "disabled" : motionPayload.status === "fulfilled" ? motionTransport === "fixture" ? "fixture" : "live" : "fallback",
      transport: !motionEnabled ? "disabled" : motionPayload.status === "fulfilled" ? motionTransport ?? "remote" : "preview",
      url: resolvedEndpoints.motionsUrl,
      detail: !motionEnabled
        ? "Off-chain governance is disabled for this release."
        : motionPayload.status === "fulfilled"
          ? `Loaded ${motions.length} motion records from ${resolvedEndpoints.motionsSourceLabel.toLowerCase()}.`
          : `Using preview motion queue because ${resolvedEndpoints.motionsSourceLabel.toLowerCase()} failed at ${resolvedEndpoints.motionsUrl}.`
    },
    {
      label: "Treasury",
      state: !treasuryEnabled ? "disabled" : treasuryPayload.status === "fulfilled" ? treasuryTransport === "fixture" ? "fixture" : "live" : "fallback",
      transport: !treasuryEnabled ? "disabled" : treasuryPayload.status === "fulfilled" ? treasuryTransport ?? "remote" : "preview",
      url: resolvedEndpoints.treasuryUrl,
      detail: !treasuryEnabled
        ? "Treasury view is disabled for this release."
        : treasuryPayload.status === "fulfilled"
          ? `Loaded treasury snapshot and ${movements.length} movement records from ${resolvedEndpoints.treasurySourceLabel.toLowerCase()}.`
          : `Using preview treasury snapshot because ${resolvedEndpoints.treasurySourceLabel.toLowerCase()} failed at ${resolvedEndpoints.treasuryUrl}.`
    },
    {
      label: "Guardian",
      state: guardianPayload.status === "fulfilled" ? guardianTransport === "fixture" ? "fixture" : "live" : "fallback",
      transport: guardianPayload.status === "fulfilled" ? guardianTransport ?? "remote" : "preview",
      url: resolvedEndpoints.guardianUrl,
      detail: guardianPayload.status === "fulfilled"
        ? `Loaded guardian status and ${guardianEventList.length} event records from ${resolvedEndpoints.guardianSourceLabel.toLowerCase()}.`
        : `Using preview guardian status because ${resolvedEndpoints.guardianSourceLabel.toLowerCase()} failed at ${resolvedEndpoints.guardianUrl}.`
    },
    {
      label: "Workspace",
      state: workspacePayload.status === "fulfilled" ? workspaceTransport === "fixture" ? "fixture" : "live" : "fallback",
      transport: workspacePayload.status === "fulfilled" ? workspaceTransport ?? "remote" : "preview",
      url: resolvedEndpoints.workspaceUrl,
      detail: workspacePayload.status === "fulfilled"
        ? `Loaded ${workspace.length} workspace records from ${resolvedEndpoints.workspaceSourceLabel.toLowerCase()}.`
        : `Using preview workspace queue because ${resolvedEndpoints.workspaceSourceLabel.toLowerCase()} failed at ${resolvedEndpoints.workspaceUrl}.`
    },
    {
      label: "Members",
      state: membersPayload.status === "fulfilled" ? membersTransport === "fixture" ? "fixture" : "live" : "fallback",
      transport: membersPayload.status === "fulfilled" ? membersTransport ?? "remote" : "preview",
      url: resolvedEndpoints.membersUrl,
      detail: membersPayload.status === "fulfilled"
        ? `Loaded ${members.length} member records from ${resolvedEndpoints.membersSourceLabel.toLowerCase()}.`
        : `Using preview member roster because ${resolvedEndpoints.membersSourceLabel.toLowerCase()} failed at ${resolvedEndpoints.membersUrl}.`
    }
  ];

  const enabledFeedCount = 4 + (motionEnabled ? 1 : 0) + (treasuryEnabled ? 1 : 0);

  if (failures.length === 0) {
    const successfulTransports = [
      proposalTransport,
      motionEnabled ? motionTransport : null,
      treasuryEnabled ? treasuryTransport : null,
      guardianTransport,
      workspaceTransport,
      membersTransport
    ].filter(Boolean);
    const allFixture = successfulTransports.every((transport) => transport === "fixture");
    const someFixture = successfulTransports.some((transport) => transport === "fixture");

    return {
      proposals,
      motions: motionEnabled ? motions : [],
      workspaceItems: workspace,
      treasury,
      treasuryMovements: treasuryEnabled ? movements : [],
      guardian,
      guardianEvents: guardianEventList,
      members,
      source: allFixture ? "fixture" : someFixture ? "mixed" : "remote",
      syncMessage: allFixture
        ? "Loaded fixture-backed dashboard data through the normalized feed pipeline."
        : someFixture
          ? "Loaded dashboard data from a mix of fixture-backed and live governance feeds."
          : "Loaded live dashboard data from configured governance services.",
      lastUpdatedAt: timestamp,
      endpoints
    };
  }

  if (failures.length === enabledFeedCount) {
    const firstError = endpointResults.find((result) => result.status === "rejected");
    const message = firstError?.status === "rejected" && firstError.reason instanceof Error
      ? firstError.reason.message
      : "remote dashboard services were unavailable";
    const fallbackData = buildMockDashboardData(`Fell back to local preview data: ${message}`);
    return {
      ...fallbackData,
      endpoints
    };
  }

  return {
    proposals,
    motions: motionEnabled ? motions : [],
    workspaceItems: workspace,
    treasury,
    treasuryMovements: treasuryEnabled ? movements : [],
    guardian,
    guardianEvents: guardianEventList,
    members,
    source: "mixed",
    syncMessage: `Loaded live data with preview fallback for ${failures.join(", ")}.`,
    lastUpdatedAt: timestamp,
    endpoints
  };
}
