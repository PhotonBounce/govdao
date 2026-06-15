import { useState } from "react";
import { AppManifest } from "../types";
import {
  queueProposal,
  executeProposal,
  LifecycleAction,
  LifecyclePhase,
} from "../data/proposalLifecycleSource";

interface ActionState {
  proposalId: string;
  action: LifecycleAction;
  phase: LifecyclePhase | "done" | "error";
  error: string | null;
}

export function useProposalLifecycle(manifest: AppManifest, onChanged?: () => void) {
  const [state, setState] = useState<ActionState | null>(null);

  async function run(action: LifecycleAction, proposalId: string) {
    setState({ proposalId, action, phase: "signing", error: null });
    try {
      const fn = action === "queue" ? queueProposal : executeProposal;
      await fn(proposalId, manifest, (phase) =>
        setState({ proposalId, action, phase, error: null })
      );
      setState({ proposalId, action, phase: "done", error: null });
      onChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed.";
      setState({ proposalId, action, phase: "error", error: message });
    }
  }

  return {
    actionState: state,
    isBusy: state?.phase === "signing" || state?.phase === "pending",
    queue: (proposalId: string) => run("queue", proposalId),
    execute: (proposalId: string) => run("execute", proposalId),
  };
}
