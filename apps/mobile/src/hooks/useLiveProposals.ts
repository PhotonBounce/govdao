import { useEffect, useRef, useState } from "react";
import { AppManifest } from "../types";
import { loadLiveProposals, LiveProposalsResult } from "../data/chainSource";

interface LiveProposalsState {
  result: LiveProposalsResult;
  loading: boolean;
}

const INITIAL: LiveProposalsResult = {
  available: false,
  detail: "Preparing live proposal read.",
  proposals: [],
};

export function useLiveProposals(manifest: AppManifest) {
  const requestIdRef = useRef(0);
  const [state, setState] = useState<LiveProposalsState>({ result: INITIAL, loading: true });

  async function refresh() {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((current) => ({ ...current, loading: true }));

    const result = await loadLiveProposals(manifest).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "an unexpected chain error occurred";
      return { available: false, detail: `Live proposals failed: ${message}.`, proposals: [] };
    });

    if (requestIdRef.current === requestId) {
      setState({ result, loading: false });
    }
  }

  useEffect(() => {
    void refresh();
    return () => {
      requestIdRef.current += 1;
    };
  }, [manifest]);

  return {
    liveProposals: state.result,
    liveProposalsLoading: state.loading,
    refreshLiveProposals: refresh,
  };
}
