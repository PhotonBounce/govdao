import { useMemo, useRef, useState } from "react";
import { AppManifest } from "../types";
import { AccessOption, connectSession, getAccessOptions, SessionIdentity } from "../data/sessionSource";

export type SessionStatus = "signed-out" | "connecting" | "signed-in";

interface SessionState {
  status: SessionStatus;
  identity: SessionIdentity | null;
  pendingMethodId: string | null;
  error: string | null;
}

const initialState: SessionState = {
  status: "signed-out",
  identity: null,
  pendingMethodId: null,
  error: null
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "The access handshake failed unexpectedly.";
}

export function useSessionController(manifest: AppManifest) {
  const requestIdRef = useRef(0);
  const [state, setState] = useState<SessionState>(initialState);

  const accessOptions = useMemo(() => getAccessOptions(manifest), [manifest]);
  const sessionRequired = manifest.wallet.required;
  const sessionActive = state.status === "signed-in" && state.identity !== null;

  async function signIn(option: AccessOption) {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState({ status: "connecting", identity: null, pendingMethodId: option.id, error: null });

    try {
      const identity = await connectSession(option, manifest);

      if (requestIdRef.current === requestId) {
        setState({ status: "signed-in", identity, pendingMethodId: null, error: null });
      }
    } catch (error: unknown) {
      if (requestIdRef.current === requestId) {
        setState({ status: "signed-out", identity: null, pendingMethodId: null, error: getErrorMessage(error) });
      }
    }
  }

  function signOut() {
    requestIdRef.current += 1;
    setState(initialState);
  }

  return {
    accessOptions,
    sessionActive,
    sessionError: state.error,
    sessionIdentity: state.identity,
    sessionRequired,
    sessionStatus: state.status,
    pendingMethodId: state.pendingMethodId,
    signIn,
    signOut
  };
}
