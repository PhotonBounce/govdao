import { useRef, useState } from "react";
import { SessionIdentity } from "../data/sessionSource";
import { MotionDecision, MotionDecisionReceipt, submitMotionDecision } from "../data/motionActionSource";

export type MotionActionStatus = "idle" | "reviewing" | "recording" | "recorded" | "failed";

export interface MotionActionState {
  status: MotionActionStatus;
  decision: MotionDecision | null;
  receipt: MotionDecisionReceipt | null;
  error: string | null;
}

const idleMotionActionState: MotionActionState = {
  status: "idle",
  decision: null,
  receipt: null,
  error: null
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "The motion decision failed unexpectedly.";
}

export function useMotionActionController(identity: SessionIdentity | null, anchoringEnabled: boolean) {
  const requestIdsRef = useRef<Record<string, number>>({});
  const [actionStates, setActionStates] = useState<Record<string, MotionActionState>>({});

  function getMotionActionState(motionId: string): MotionActionState {
    return actionStates[motionId] ?? idleMotionActionState;
  }

  function setMotionActionState(motionId: string, state: MotionActionState) {
    setActionStates((current) => ({ ...current, [motionId]: state }));
  }

  async function decideMotion(motionId: string, decision: MotionDecision) {
    if (!identity) {
      setMotionActionState(motionId, { ...idleMotionActionState, status: "failed", error: "Sign in before recording a decision." });
      return;
    }

    const requestId = (requestIdsRef.current[motionId] ?? 0) + 1;
    requestIdsRef.current[motionId] = requestId;
    setMotionActionState(motionId, { status: "reviewing", decision, receipt: null, error: null });

    try {
      const receipt = await submitMotionDecision(motionId, decision, identity, anchoringEnabled, (phase) => {
        if (requestIdsRef.current[motionId] === requestId && phase === "recording") {
          setMotionActionState(motionId, { status: "recording", decision, receipt: null, error: null });
        }
      });

      if (requestIdsRef.current[motionId] === requestId) {
        setMotionActionState(motionId, { status: "recorded", decision, receipt, error: null });
      }
    } catch (error: unknown) {
      if (requestIdsRef.current[motionId] === requestId) {
        setMotionActionState(motionId, { status: "failed", decision, receipt: null, error: getErrorMessage(error) });
      }
    }
  }

  function resetMotionAction(motionId: string) {
    requestIdsRef.current[motionId] = (requestIdsRef.current[motionId] ?? 0) + 1;
    setMotionActionState(motionId, idleMotionActionState);
  }

  return {
    decideMotion,
    getMotionActionState,
    resetMotionAction
  };
}
