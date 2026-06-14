import { AppManifest } from "../types";

export interface ProposalParticipation {
  proposalId: string;
  title: string;
  participationRate: number;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  passed: boolean;
  timestamp: string;
}

export interface DelegateStat {
  id: string;
  label: string;
  role: string;
  votesCount: number;
  participationRate: number;
  avgVoteWeight: number;
}

export interface GovernanceAnalytics {
  avgParticipation: number;
  passRate: number;
  totalProposals: number;
  totalVotes: number;
  avgQuorumDistance: number;
  participationHistory: ProposalParticipation[];
  topDelegates: DelegateStat[];
  transport: "fixture" | "remote";
}

const fixtureHistory: ProposalParticipation[] = [
  { proposalId: "GOV-105", title: "Treasury Reporting Cadence", participationRate: 78, forVotes: 12, againstVotes: 3, abstainVotes: 2, passed: true, timestamp: "2025-05-21T18:00:00Z" },
  { proposalId: "GOV-104", title: "Expand Guardian Signer Set", participationRate: 84, forVotes: 14, againstVotes: 2, abstainVotes: 1, passed: true, timestamp: "2025-05-20T22:00:00Z" },
  { proposalId: "GOV-103", title: "Protocol Fee Reduction Q2", participationRate: 62, forVotes: 8, againstVotes: 7, abstainVotes: 3, passed: false, timestamp: "2025-05-10T16:00:00Z" },
  { proposalId: "GOV-102", title: "Community Grants Tranche 3", participationRate: 91, forVotes: 16, againstVotes: 1, abstainVotes: 1, passed: true, timestamp: "2025-04-28T14:00:00Z" },
  { proposalId: "GOV-101", title: "Member Registry Upgrade", participationRate: 71, forVotes: 11, againstVotes: 4, abstainVotes: 2, passed: true, timestamp: "2025-04-14T12:00:00Z" },
  { proposalId: "GOV-100", title: "Emergency Guardian Threshold", participationRate: 55, forVotes: 7, againstVotes: 5, abstainVotes: 4, passed: false, timestamp: "2025-03-30T10:00:00Z" },
];

const fixtureDelegates: DelegateStat[] = [
  { id: "MBR-001", label: "Release Council", role: "Proposer", votesCount: 6, participationRate: 100, avgVoteWeight: 12500 },
  { id: "MBR-002", label: "Security Desk", role: "Guardian", votesCount: 5, participationRate: 83, avgVoteWeight: 11200 },
  { id: "MBR-003", label: "Community Operations", role: "Delegate", votesCount: 6, participationRate: 100, avgVoteWeight: 9800 },
];

export function loadAnalytics(_manifest: AppManifest): GovernanceAnalytics {
  const passed = fixtureHistory.filter((p) => p.passed).length;
  const avgParticipation = Math.round(
    fixtureHistory.reduce((sum, p) => sum + p.participationRate, 0) / fixtureHistory.length
  );
  const avgQuorumDistance = Math.round(
    fixtureHistory.reduce((sum, p) => {
      const total = p.forVotes + p.againstVotes + p.abstainVotes;
      return sum + Math.abs(p.forVotes / total - 0.5) * 100;
    }, 0) / fixtureHistory.length
  );

  return {
    avgParticipation,
    passRate: Math.round((passed / fixtureHistory.length) * 100),
    totalProposals: fixtureHistory.length,
    totalVotes: fixtureHistory.reduce((sum, p) => sum + p.forVotes + p.againstVotes + p.abstainVotes, 0),
    avgQuorumDistance,
    participationHistory: fixtureHistory,
    topDelegates: fixtureDelegates,
    transport: "fixture"
  };
}
