import { AppManifest } from "../types";

export type TimelineState =
  | "created"
  | "voting"
  | "queued"
  | "executed"
  | "defeated"
  | "cancelled"
  | "expired";

export interface TimelineEntry {
  state: TimelineState;
  label: string;
  timestamp: string;
  txHash?: string;
  note?: string;
}

export interface ProposalTimeline {
  proposalId: string;
  currentState: TimelineState;
  entries: TimelineEntry[];
}

const fixtureTimelines: Record<string, ProposalTimeline> = {
  "GOV-104": {
    proposalId: "GOV-104",
    currentState: "queued",
    entries: [
      { state: "created", label: "Proposal Created", timestamp: "2025-05-18T08:00:00Z", txHash: "0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4" },
      { state: "voting", label: "Voting Opened", timestamp: "2025-05-18T09:00:00Z", note: "Voting window: 2 days" },
      { state: "queued", label: "Queued For Execution", timestamp: "2025-05-21T09:00:00Z", txHash: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2", note: "Timelock expires in 11h" }
    ]
  },
  "GOV-105": {
    proposalId: "GOV-105",
    currentState: "voting",
    entries: [
      { state: "created", label: "Proposal Created", timestamp: "2025-05-18T08:30:00Z", txHash: "0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3" },
      { state: "voting", label: "Voting Opened", timestamp: "2025-05-19T08:30:00Z", note: "Voting window: 2 days, closes in 2d" }
    ]
  },
  "GOV-201": {
    proposalId: "GOV-201",
    currentState: "voting",
    entries: [
      { state: "created", label: "Proposal Created", timestamp: "2025-05-20T10:00:00Z", txHash: "0xd1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2" },
      { state: "voting", label: "Voting Opened", timestamp: "2025-05-21T10:00:00Z", note: "Voting window closes in 18h" }
    ]
  },
  "GOV-202": {
    proposalId: "GOV-202",
    currentState: "queued",
    entries: [
      { state: "created", label: "Proposal Created", timestamp: "2025-05-14T12:00:00Z", txHash: "0xe2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3" },
      { state: "voting", label: "Voting Opened", timestamp: "2025-05-15T12:00:00Z", note: "Voting window: 2 days" },
      { state: "queued", label: "Queued For Execution", timestamp: "2025-05-17T12:00:00Z", txHash: "0xf3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4", note: "Timelock expires in 6h" }
    ]
  }
};

export function loadProposalTimeline(_manifest: AppManifest, proposalId: string): ProposalTimeline | null {
  return fixtureTimelines[proposalId] ?? null;
}

export function timelineStateTone(state: TimelineState): "pine" | "bronze" | "rose" {
  switch (state) {
    case "created": return "bronze";
    case "voting": return "bronze";
    case "queued": return "pine";
    case "executed": return "pine";
    case "defeated": return "rose";
    case "cancelled": return "rose";
    case "expired": return "bronze";
  }
}

export function timelineStateLabel(state: TimelineState): string {
  const labels: Record<TimelineState, string> = {
    created: "CREATED",
    voting: "VOTING",
    queued: "QUEUED",
    executed: "EXECUTED",
    defeated: "DEFEATED",
    cancelled: "CANCELLED",
    expired: "EXPIRED"
  };
  return labels[state];
}

export function isTerminalState(state: TimelineState): boolean {
  return state === "executed" || state === "defeated" || state === "cancelled" || state === "expired";
}
