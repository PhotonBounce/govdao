import { useEffect, useRef, useState } from "react";
import { AppManifest } from "../types";
import {
  buildDashboardRecoveryData,
  buildMockDashboardData,
  loadMobileDashboardData,
  MobileDashboardData
} from "../data/mobileDataSource";

interface MobileDashboardState {
  data: MobileDashboardData;
  loading: boolean;
}

export function useMobileDashboardData(manifest: AppManifest) {
  const requestIdRef = useRef(0);
  const lastDataRef = useRef<MobileDashboardData>(buildMockDashboardData("Preparing mobile dashboard data."));
  const [state, setState] = useState<MobileDashboardState>({
    data: lastDataRef.current,
    loading: true
  });

  async function refresh() {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((current) => ({ ...current, loading: true }));
    try {
      const data = await loadMobileDashboardData(manifest);
      lastDataRef.current = data;

      if (requestIdRef.current === requestId) {
        setState({ data, loading: false });
      }
    } catch (error: unknown) {
      const data = buildDashboardRecoveryData(lastDataRef.current, error);
      lastDataRef.current = data;

      if (requestIdRef.current === requestId) {
        setState({ data, loading: false });
      }
    }
  }

  useEffect(() => {
    void refresh();

    return () => {
      requestIdRef.current += 1;
    };
  }, [manifest]);

  return {
    dashboardData: state.data,
    loading: state.loading,
    refresh
  };
}
