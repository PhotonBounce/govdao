import { VoteTally } from "./delegateSource";

export interface QuorumStatus {
  proposalId: string;
  required: number;
  totalMembers: number;
  voted: number;
  reached: boolean;
  pct: number;
}

export interface GovernanceQuorumSummary {
  totalMembers: number;
  activeProposalCount: number;
  proposalsAtQuorum: number;
  proposalsBelowQuorum: number;
}

export function computeQuorum(tally: VoteTally, totalMembers: number, requiredPct = 50): QuorumStatus {
  const required = Math.ceil((totalMembers * requiredPct) / 100);
  const reached = tally.total >= required;
  const pct = totalMembers > 0 ? Math.round((tally.total / totalMembers) * 100) : 0;

  return {
    proposalId: tally.proposalId,
    required,
    totalMembers,
    voted: tally.total,
    reached,
    pct
  };
}

export function quorumLabel(status: QuorumStatus): string {
  return status.reached
    ? `Quorum met — ${status.voted} of ${status.totalMembers} voted`
    : `Quorum pending — ${status.voted} of ${status.required} required`;
}

export function summarizeGovernanceQuorum(
  proposalIds: string[],
  tallyFn: (id: string) => VoteTally | null,
  totalMembers: number
): GovernanceQuorumSummary {
  let atQuorum = 0;
  let belowQuorum = 0;

  for (const id of proposalIds) {
    const tally = tallyFn(id);
    if (!tally) continue;
    const status = computeQuorum(tally, totalMembers);
    if (status.reached) atQuorum++;
    else belowQuorum++;
  }

  return {
    totalMembers,
    activeProposalCount: proposalIds.length,
    proposalsAtQuorum: atQuorum,
    proposalsBelowQuorum: belowQuorum
  };
}
