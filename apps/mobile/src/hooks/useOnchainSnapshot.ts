import { useEffect, useRef, useState } from "react";
import { AppManifest } from "../types";
import { buildUnavailableSnapshot, loadOnchainSnapshot, OnchainSnapshot } from "../data/chainSource";

interface OnchainSnapshotState {
  snapshot: OnchainSnapshot;
  loading: boolean;
}

export function useOnchainSnapshot(manifest: AppManifest) {
  const requestIdRef = useRef(0);
  const [state, setState] = useState<OnchainSnapshotState>({
    snapshot: buildUnavailableSnapshot("Preparing on-chain verification."),
    loading: true
  });

  async function refresh() {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((current) => ({ ...current, loading: true }));

    const snapshot = await loadOnchainSnapshot(manifest).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "an unexpected chain error occurred";
      return buildUnavailableSnapshot(`On-chain verification failed: ${message}.`);
    });

    if (requestIdRef.current === requestId) {
      setState({ snapshot, loading: false });
    }
  }

  useEffect(() => {
    void refresh();

    return () => {
      requestIdRef.current += 1;
    };
  }, [manifest]);

  return {
    onchainSnapshot: state.snapshot,
    onchainLoading: state.loading,
    refreshOnchain: refresh
  };
}
