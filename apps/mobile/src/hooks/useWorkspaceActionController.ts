import { useRef, useState } from "react";
import { AppManifest } from "../types";
import { SessionIdentity } from "../data/sessionSource";
import {
  WorkspaceAction,
  WorkspaceActionPhase,
  WorkspaceActionResult,
  submitWorkspaceAction
} from "../data/workspaceActionSource";

interface ActionState {
  phase: WorkspaceActionPhase;
  result: WorkspaceActionResult | null;
  error: string | null;
}

export function useWorkspaceActionController(identity: SessionIdentity | null, manifest: AppManifest) {
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const requestIdRef = useRef(0);

  function getActionState(itemId: string): ActionState {
    return actionStates[itemId] ?? { phase: "idle", result: null, error: null };
  }

  async function performAction(itemId: string, action: WorkspaceAction) {
    const myId = ++requestIdRef.current;

    setActionStates((prev) => ({
      ...prev,
      [itemId]: { phase: "submitting", result: null, error: null }
    }));

    try {
      const result = await submitWorkspaceAction(itemId, action, identity, manifest, (p) => {
        if (requestIdRef.current === myId) {
          setActionStates((prev) => ({
            ...prev,
            [itemId]: { ...prev[itemId], phase: p }
          }));
        }
      });
      if (requestIdRef.current === myId) {
        setActionStates((prev) => ({
          ...prev,
          [itemId]: { phase: "done", result, error: null }
        }));
      }
    } catch (err) {
      if (requestIdRef.current === myId) {
        setActionStates((prev) => ({
          ...prev,
          [itemId]: { phase: "error", result: null, error: err instanceof Error ? err.message : "Action failed." }
        }));
      }
    }
  }

  function resetAction(itemId: string) {
    setActionStates((prev) => ({
      ...prev,
      [itemId]: { phase: "idle", result: null, error: null }
    }));
  }

  return { getActionState, performAction, resetAction };
}
