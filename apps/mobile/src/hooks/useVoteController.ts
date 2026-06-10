import { useRef, useState } from "react";
import { SessionIdentity } from "../data/sessionSource";
import { castVoteTransaction, VoteChoice, VoteReceipt } from "../data/voteSource";

export type VoteStatus = "idle" | "signing" | "pending" | "confirmed" | "failed";

export interface VoteState {
  status: VoteStatus;
  choice: VoteChoice | null;
  receipt: VoteReceipt | null;
  error: string | null;
}

const idleVoteState: VoteState = {
  status: "idle",
  choice: null,
  receipt: null,
  error: null
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "The vote transaction failed unexpectedly.";
}

export function useVoteController(identity: SessionIdentity | null) {
  const requestIdsRef = useRef<Record<string, number>>({});
  const [voteStates, setVoteStates] = useState<Record<string, VoteState>>({});

  function getVoteState(proposalId: string): VoteState {
    return voteStates[proposalId] ?? idleVoteState;
  }

  function setVoteState(proposalId: string, state: VoteState) {
    setVoteStates((current) => ({ ...current, [proposalId]: state }));
  }

  async function castVote(proposalId: string, choice: VoteChoice) {
    if (!identity) {
      setVoteState(proposalId, { ...idleVoteState, status: "failed", error: "Sign in before casting a vote." });
      return;
    }

    const requestId = (requestIdsRef.current[proposalId] ?? 0) + 1;
    requestIdsRef.current[proposalId] = requestId;
    setVoteState(proposalId, { status: "signing", choice, receipt: null, error: null });

    try {
      const receipt = await castVoteTransaction(proposalId, choice, identity, (phase) => {
        if (requestIdsRef.current[proposalId] === requestId && phase === "pending") {
          setVoteState(proposalId, { status: "pending", choice, receipt: null, error: null });
        }
      });

      if (requestIdsRef.current[proposalId] === requestId) {
        setVoteState(proposalId, { status: "confirmed", choice, receipt, error: null });
      }
    } catch (error: unknown) {
      if (requestIdsRef.current[proposalId] === requestId) {
        setVoteState(proposalId, { status: "failed", choice, receipt: null, error: getErrorMessage(error) });
      }
    }
  }

  function resetVote(proposalId: string) {
    requestIdsRef.current[proposalId] = (requestIdsRef.current[proposalId] ?? 0) + 1;
    setVoteState(proposalId, idleVoteState);
  }

  return {
    castVote,
    getVoteState,
    resetVote
  };
}
