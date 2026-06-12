import { AppManifest } from "../types";

export type ActivityEventType = "proposal" | "vote" | "motion" | "treasury" | "guardian" | "member";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  title: string;
  actor: string;
  summary: string;
  timestamp: string;
  refId?: string;
}

const fixtureActivityEvents: ActivityEvent[] = [
  {
    id: "ACT-001",
    type: "guardian",
    title: "Guardian drill completed",
    actor: "Security Desk",
    summary: "Quarterly pause drill completed successfully — all 5 signers responded within the SLA window.",
    timestamp: "2025-05-22T08:00:00Z",
    refId: "GRD-12"
  },
  {
    id: "ACT-002",
    type: "vote",
    title: "Vote recorded: GOV-105",
    actor: "Community Operations",
    summary: "Abstain vote anchored for Treasury reporting cadence upgrade.",
    timestamp: "2025-05-21T16:00:00Z",
    refId: "GOV-105"
  },
  {
    id: "ACT-003",
    type: "vote",
    title: "Vote recorded: GOV-105",
    actor: "Release Council",
    summary: "Against vote recorded for Treasury reporting cadence upgrade.",
    timestamp: "2025-05-21T14:30:00Z",
    refId: "GOV-105"
  },
  {
    id: "ACT-004",
    type: "treasury",
    title: "Treasury movement settled",
    actor: "Treasury Timelock",
    summary: "Member dues sweep of 4.6 ETH settled from Membership Contract.",
    timestamp: "2025-05-21T12:00:00Z",
    refId: "TRX-91"
  },
  {
    id: "ACT-005",
    type: "motion",
    title: "Motion decision recorded: OPS-22",
    actor: "Security Council",
    summary: "Approved — partner onboarding pack cleared legal ops review.",
    timestamp: "2025-05-21T10:00:00Z",
    refId: "OPS-22"
  },
  {
    id: "ACT-006",
    type: "proposal",
    title: "Proposal queued: GOV-104",
    actor: "Security Council",
    summary: "Expand emergency guardian signer set passed voting and entered the 11h timelock queue.",
    timestamp: "2025-05-20T18:00:00Z",
    refId: "GOV-104"
  },
  {
    id: "ACT-007",
    type: "vote",
    title: "Vote recorded: GOV-104",
    actor: "Community Operations",
    summary: "Against vote recorded for Expand emergency guardian signer set.",
    timestamp: "2025-05-20T14:45:00Z",
    refId: "GOV-104"
  },
  {
    id: "ACT-008",
    type: "vote",
    title: "Vote recorded: GOV-104",
    actor: "Release Council",
    summary: "For vote recorded for Expand emergency guardian signer set.",
    timestamp: "2025-05-20T12:00:00Z",
    refId: "GOV-104"
  },
  {
    id: "ACT-009",
    type: "treasury",
    title: "Treasury movement queued",
    actor: "Treasury Timelock",
    summary: "Community grants tranche of 8.5 ETH queued for Grants Committee Safe.",
    timestamp: "2025-05-19T11:00:00Z",
    refId: "TRX-93"
  },
  {
    id: "ACT-010",
    type: "proposal",
    title: "Proposal created: GOV-105",
    actor: "Finance Working Group",
    summary: "Treasury reporting cadence upgrade submitted for delegate review.",
    timestamp: "2025-05-18T08:30:00Z",
    refId: "GOV-105"
  },
  {
    id: "ACT-011",
    type: "motion",
    title: "Motion created: OPS-24",
    actor: "Community Team",
    summary: "Regional meetup micro-budget motion opened for delegate approval.",
    timestamp: "2025-05-17T14:00:00Z",
    refId: "OPS-24"
  },
  {
    id: "ACT-012",
    type: "member",
    title: "Member registered",
    actor: "Community Operations",
    summary: "Community Operations registered to the member registry (MBR-004).",
    timestamp: "2025-04-05T09:00:00Z",
    refId: "MBR-004"
  }
];

export interface ActivityFeedResult {
  events: ActivityEvent[];
  total: number;
  hasMore: boolean;
  transport: "fixture" | "remote";
}

const PAGE_SIZE = 10;

export function loadActivityFeed(
  _manifest: AppManifest,
  filter: ActivityEventType | "all" = "all",
  page = 0
): ActivityFeedResult {
  const filtered =
    filter === "all" ? fixtureActivityEvents : fixtureActivityEvents.filter((e) => e.type === filter);

  const start = page * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);

  return {
    events: slice,
    total: filtered.length,
    hasMore: start + PAGE_SIZE < filtered.length,
    transport: "fixture"
  };
}

export function eventTypeLabel(type: ActivityEventType): string {
  const labels: Record<ActivityEventType, string> = {
    proposal: "PROPOSAL",
    vote: "VOTE",
    motion: "MOTION",
    treasury: "TREASURY",
    guardian: "GUARDIAN",
    member: "MEMBER"
  };
  return labels[type];
}

export function eventTypeTone(type: ActivityEventType): "pine" | "bronze" | "rose" {
  const tones: Record<ActivityEventType, "pine" | "bronze" | "rose"> = {
    proposal: "pine",
    vote: "bronze",
    motion: "bronze",
    treasury: "pine",
    guardian: "rose",
    member: "bronze"
  };
  return tones[type];
}
