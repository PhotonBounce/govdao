import { AppManifest } from "../types";
import { offchainMotions, proposalFeed, workspaceItems } from "./mockState";

export type ProposalItem = (typeof proposalFeed)[number];
export type MotionItem = (typeof offchainMotions)[number];
export type WorkspaceItem = (typeof workspaceItems)[number];
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
        recommendedAction: "Collect final delegate approvals and publish the release note set"
      },
      {
        proposalId: "GOV-202",
        name: "Raise guardian drill cadence",
        status: "Queued",
        origin: "On-chain",
        executionEta: "6h",
        description: "Moves the emergency response rehearsal from quarterly to monthly with expanded signer coverage.",
        sponsor: "Security Operations",
        recommendedAction: "Wait for timelock expiry and executor confirmation"
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
  workspaceUrl: string;
  workspaceSourceLabel: string;
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
    source: "mock",
    syncMessage: reason,
    lastUpdatedAt: getTimestamp(),
    endpoints: [
      { label: "Proposals", state: "fallback", transport: "preview", url: null, detail: "Using preview proposal feed." },
      { label: "Motions", state: "fallback", transport: "preview", url: null, detail: "Using preview motion queue." },
      { label: "Workspace", state: "fallback", transport: "preview", url: null, detail: "Using preview workspace queue." }
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

  return {
    proposalsUrl: joinUrl(proposalModuleBaseUrl ?? proposalServiceBaseUrl, manifest.services.mobileFeeds.proposalsPath),
    proposalsSourceLabel: describeSourceLabel(proposalModuleBaseUrl ?? proposalServiceBaseUrl, proposalModuleBaseUrl ? "DAO module API" : "Indexer service"),
    motionsUrl: manifest.governance.offchain.enabled ? joinUrl(motionServiceBaseUrl, manifest.services.mobileFeeds.motionsPath) : null,
    motionsSourceLabel: manifest.governance.offchain.enabled ? describeSourceLabel(motionServiceBaseUrl, "Off-chain governance API") : "Off-chain governance disabled",
    workspaceUrl: joinUrl(workspaceModuleBaseUrl ?? workspaceServiceBaseUrl, manifest.services.mobileFeeds.workspacePath),
    workspaceSourceLabel: describeSourceLabel(workspaceModuleBaseUrl ?? workspaceServiceBaseUrl, workspaceModuleBaseUrl ? "Workspace module API" : "Metadata service")
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
    nextStep: readString(record.nextStep ?? record.next_action ?? record.recommendedAction, fallback.nextStep)
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

function isUsableEndpointUrl(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return isFixtureUrl(value) || (!isPlaceholder(value) && value.startsWith("https://"));
}

function canUseConfiguredFeeds(resolvedEndpoints: ResolvedDashboardEndpoints, motionEnabled: boolean): boolean {
  if (!isUsableEndpointUrl(resolvedEndpoints.proposalsUrl) || !isUsableEndpointUrl(resolvedEndpoints.workspaceUrl)) {
    return false;
  }

  if (motionEnabled && !isUsableEndpointUrl(resolvedEndpoints.motionsUrl)) {
    return false;
  }

  return true;
}

export async function loadMobileDashboardData(manifest: AppManifest): Promise<MobileDashboardData> {
  const resolvedEndpoints = resolveDashboardEndpoints(manifest);
  const motionEnabled = manifest.governance.offchain.enabled;

  if (!canUseConfiguredFeeds(resolvedEndpoints, motionEnabled)) {
    const previewData = buildMockDashboardData("Using local preview data until service endpoints are promoted.");
    return {
      ...previewData,
      endpoints: [
        { label: "Proposals", state: "fallback", transport: "preview", url: resolvedEndpoints.proposalsUrl, detail: `${resolvedEndpoints.proposalsSourceLabel} is still placeholder-backed.` },
        { label: "Motions", state: manifest.governance.offchain.enabled ? "fallback" : "disabled", transport: manifest.governance.offchain.enabled ? "preview" : "disabled", url: resolvedEndpoints.motionsUrl, detail: manifest.governance.offchain.enabled ? `${resolvedEndpoints.motionsSourceLabel} is still placeholder-backed.` : "Off-chain governance is disabled." },
        { label: "Workspace", state: "fallback", transport: "preview", url: resolvedEndpoints.workspaceUrl, detail: `${resolvedEndpoints.workspaceSourceLabel} is still placeholder-backed.` }
      ]
    };
  }

  const endpointResults = await Promise.allSettled([
    fetchDashboardPayload<unknown>(resolvedEndpoints.proposalsUrl),
    motionEnabled && resolvedEndpoints.motionsUrl
      ? fetchDashboardPayload<unknown>(resolvedEndpoints.motionsUrl)
      : Promise.resolve({ payload: [], transport: "fixture" as const }),
    fetchDashboardPayload<unknown>(resolvedEndpoints.workspaceUrl)
  ]);

  const failures: string[] = [];
  const proposalPayload = endpointResults[0];
  const motionPayload = endpointResults[1];
  const workspacePayload = endpointResults[2];

  const proposals = proposalPayload.status === "fulfilled"
    ? normalizeProposalCollection(proposalPayload.value.payload)
    : (failures.push("proposals"), proposalFeed);
  const motions = motionPayload.status === "fulfilled"
    ? normalizeMotionCollection(motionPayload.value.payload)
    : (motionEnabled ? failures.push("motions") : null, offchainMotions);
  const workspace = workspacePayload.status === "fulfilled"
    ? normalizeWorkspaceCollection(workspacePayload.value.payload)
    : (failures.push("workspace"), workspaceItems);
  const proposalTransport = proposalPayload.status === "fulfilled" ? proposalPayload.value.transport : null;
  const motionTransport = motionPayload.status === "fulfilled" ? motionPayload.value.transport : null;
  const workspaceTransport = workspacePayload.status === "fulfilled" ? workspacePayload.value.transport : null;

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
      label: "Workspace",
      state: workspacePayload.status === "fulfilled" ? workspaceTransport === "fixture" ? "fixture" : "live" : "fallback",
      transport: workspacePayload.status === "fulfilled" ? workspaceTransport ?? "remote" : "preview",
      url: resolvedEndpoints.workspaceUrl,
      detail: workspacePayload.status === "fulfilled"
        ? `Loaded ${workspace.length} workspace records from ${resolvedEndpoints.workspaceSourceLabel.toLowerCase()}.`
        : `Using preview workspace queue because ${resolvedEndpoints.workspaceSourceLabel.toLowerCase()} failed at ${resolvedEndpoints.workspaceUrl}.`
    }
  ];

  if (failures.length === 0) {
    const successfulTransports = [proposalTransport, motionEnabled ? motionTransport : null, workspaceTransport].filter(Boolean);
    const allFixture = successfulTransports.every((transport) => transport === "fixture");
    const someFixture = successfulTransports.some((transport) => transport === "fixture");

    return {
      proposals,
      motions: motionEnabled ? motions : [],
      workspaceItems: workspace,
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

  if (failures.length === 3 || (failures.length === 2 && !motionEnabled)) {
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
    source: "mixed",
    syncMessage: `Loaded live data with preview fallback for ${failures.join(", ")}.`,
    lastUpdatedAt: timestamp,
    endpoints
  };
}
