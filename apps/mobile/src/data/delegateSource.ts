import { AppManifest } from "../types";

export type VoteChoice = "For" | "Against" | "Abstain";

export interface DelegateVoteRecord {
  proposalId: string;
  proposalTitle: string;
  choice: VoteChoice;
  votedAt: string;
  anchorHash?: string;
}

export interface VoteTally {
  proposalId: string;
  forCount: number;
  againstCount: number;
  abstainCount: number;
  total: number;
  forPct: number;
  againstPct: number;
  abstainPct: number;
  voters: Array<{ address: string; displayName: string; choice: VoteChoice }>;
}

export interface DelegateProfile {
  memberId: string;
  address: string;
  displayName: string;
  role: string;
  participationRate: number;
  recentVotes: DelegateVoteRecord[];
}

const fixtureTallies: Record<string, VoteTally> = {
  "GOV-201": {
    proposalId: "GOV-201",
    forCount: 4,
    againstCount: 0,
    abstainCount: 0,
    total: 4,
    forPct: 100,
    againstPct: 0,
    abstainPct: 0,
    voters: [
      { address: "0xA1b2C3d4E5f6a7B8C9d0E1f2A3B4C5D6E7F8a9B0", displayName: "Security Council", choice: "For" },
      { address: "0xD4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0C1d2E3", displayName: "Finance Working Group", choice: "For" },
      { address: "0xB9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8", displayName: "Release Council", choice: "For" },
      { address: "0xE2f3A4b5C6d7E8f9A0b1C2d3E4f5A6b7C8d9E0f1", displayName: "Community Operations", choice: "For" }
    ]
  },
  "GOV-202": {
    proposalId: "GOV-202",
    forCount: 3,
    againstCount: 0,
    abstainCount: 1,
    total: 4,
    forPct: 75,
    againstPct: 0,
    abstainPct: 25,
    voters: [
      { address: "0xA1b2C3d4E5f6a7B8C9d0E1f2A3B4C5D6E7F8a9B0", displayName: "Security Council", choice: "For" },
      { address: "0xD4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0C1d2E3", displayName: "Finance Working Group", choice: "For" },
      { address: "0xB9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8", displayName: "Release Council", choice: "Abstain" },
      { address: "0xE2f3A4b5C6d7E8f9A0b1C2d3E4f5A6b7C8d9E0f1", displayName: "Community Operations", choice: "For" }
    ]
  },
  "GOV-104": {
    proposalId: "GOV-104",
    forCount: 3,
    againstCount: 1,
    abstainCount: 0,
    total: 4,
    forPct: 75,
    againstPct: 25,
    abstainPct: 0,
    voters: [
      { address: "0xA1b2C3d4E5f6a7B8C9d0E1f2A3B4C5D6E7F8a9B0", displayName: "Security Council", choice: "For" },
      { address: "0xD4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0C1d2E3", displayName: "Finance Working Group", choice: "For" },
      { address: "0xB9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8", displayName: "Release Council", choice: "For" },
      { address: "0xE2f3A4b5C6d7E8f9A0b1C2d3E4f5A6b7C8d9E0f1", displayName: "Community Operations", choice: "Against" }
    ]
  },
  "GOV-105": {
    proposalId: "GOV-105",
    forCount: 2,
    againstCount: 1,
    abstainCount: 1,
    total: 4,
    forPct: 50,
    againstPct: 25,
    abstainPct: 25,
    voters: [
      { address: "0xA1b2C3d4E5f6a7B8C9d0E1f2A3B4C5D6E7F8a9B0", displayName: "Security Council", choice: "For" },
      { address: "0xD4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0C1d2E3", displayName: "Finance Working Group", choice: "For" },
      { address: "0xB9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8", displayName: "Release Council", choice: "Against" },
      { address: "0xE2f3A4b5C6d7E8f9A0b1C2d3E4f5A6b7C8d9E0f1", displayName: "Community Operations", choice: "Abstain" }
    ]
  }
};

const fixtureDelegateProfiles: DelegateProfile[] = [
  {
    memberId: "MBR-001",
    address: "0xA1b2C3d4E5f6a7B8C9d0E1f2A3B4C5D6E7F8a9B0",
    displayName: "Security Council",
    role: "Guardian Delegate",
    participationRate: 100,
    recentVotes: [
      { proposalId: "GOV-104", proposalTitle: "Expand emergency guardian signer set", choice: "For", votedAt: "2025-05-21T10:30:00Z" },
      { proposalId: "GOV-105", proposalTitle: "Treasury reporting cadence upgrade", choice: "For", votedAt: "2025-05-18T09:00:00Z", anchorHash: "0xabc1230000000000000000000000000000000000000000000000000000000000" }
    ]
  },
  {
    memberId: "MBR-002",
    address: "0xD4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0C1d2E3",
    displayName: "Finance Working Group",
    role: "Treasury Steward",
    participationRate: 100,
    recentVotes: [
      { proposalId: "GOV-104", proposalTitle: "Expand emergency guardian signer set", choice: "For", votedAt: "2025-05-21T11:00:00Z" },
      { proposalId: "GOV-105", proposalTitle: "Treasury reporting cadence upgrade", choice: "For", votedAt: "2025-05-18T10:15:00Z" }
    ]
  },
  {
    memberId: "MBR-003",
    address: "0xB9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8",
    displayName: "Release Council",
    role: "Protocol Operator",
    participationRate: 100,
    recentVotes: [
      { proposalId: "GOV-104", proposalTitle: "Expand emergency guardian signer set", choice: "For", votedAt: "2025-05-21T12:00:00Z" },
      { proposalId: "GOV-105", proposalTitle: "Treasury reporting cadence upgrade", choice: "Against", votedAt: "2025-05-18T14:30:00Z" }
    ]
  },
  {
    memberId: "MBR-004",
    address: "0xE2f3A4b5C6d7E8f9A0b1C2d3E4f5A6b7C8d9E0f1",
    displayName: "Community Operations",
    role: "Delegate",
    participationRate: 75,
    recentVotes: [
      { proposalId: "GOV-104", proposalTitle: "Expand emergency guardian signer set", choice: "Against", votedAt: "2025-05-21T14:45:00Z" },
      { proposalId: "GOV-105", proposalTitle: "Treasury reporting cadence upgrade", choice: "Abstain", votedAt: "2025-05-18T16:00:00Z" }
    ]
  }
];

export function loadVoteTally(_manifest: AppManifest, proposalId: string): VoteTally | null {
  return fixtureTallies[proposalId] ?? null;
}

export function loadDelegateProfile(_manifest: AppManifest, memberId: string): DelegateProfile | null {
  return fixtureDelegateProfiles.find((p) => p.memberId === memberId) ?? null;
}

export function formatParticipationRate(rate: number): string {
  return `${rate}%`;
}

export function choiceTone(choice: VoteChoice): "pine" | "rose" | "bronze" {
  if (choice === "For") return "pine";
  if (choice === "Against") return "rose";
  return "bronze";
}

export function deriveOutcome(tally: VoteTally): "Passed" | "Defeated" | "Tied" | "Quorum Pending" {
  if (tally.total === 0) return "Quorum Pending";
  if (tally.forCount > tally.againstCount) return "Passed";
  if (tally.againstCount > tally.forCount) return "Defeated";
  return "Tied";
}
