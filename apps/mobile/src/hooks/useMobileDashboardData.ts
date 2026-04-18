import { useEffect, useRef, useState } from "react";
import { AppManifest } from "../types";
import { buildMockDashboardData, loadMobileDashboardData, MobileDashboardData } from "../data/mobileDataSource";

interface MobileDashboardState {
  data: MobileDashboardData;
  loading: boolean;
}

export function useMobileDashboardData(manifest: AppManifest) {
  const requestIdRef = useRef(0);
  const [state, setState] = useState<MobileDashboardState>({
    data: buildMockDashboardData("Preparing mobile dashboard data."),
    loading: true
  });

  async function refresh() {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((current) => ({ ...current, loading: true }));
    const data = await loadMobileDashboardData(manifest);
    if (requestIdRef.current === requestId) {
      setState({ data, loading: false });
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
