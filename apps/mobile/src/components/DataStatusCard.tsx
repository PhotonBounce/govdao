import { Pressable, StyleSheet, Text } from "react-native";
import { SectionCard } from "./SectionCard";
import { SignalRow } from "./SignalRow";
import { DashboardEndpointStatus } from "../data/mobileDataSource";
import { palette, radii } from "../theme";

interface DataStatusCardProps {
  loading: boolean;
  source: "mock" | "remote" | "mixed";
  syncMessage: string;
  lastUpdatedAt: string;
  endpoints: DashboardEndpointStatus[];
  onRefresh: () => void;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function DataStatusCard({ loading, source, syncMessage, lastUpdatedAt, endpoints, onRefresh }: DataStatusCardProps) {
  const title = source === "remote"
    ? "Live Service Feed"
    : source === "mixed"
      ? "Live Feed With Preview Fallback"
      : "Preview Data Feed";
  const sourceLabel = source === "remote"
    ? "Remote services"
    : source === "mixed"
      ? "Remote and preview"
      : "Local preview";
  const sourceTone = source === "remote" ? "good" : source === "mixed" ? "warning" : "neutral";

  return (
    <SectionCard
      eyebrow="Data Source"
      title={title}
      subtitle={syncMessage}
    >
      <SignalRow label="Sync status" value={loading ? "Refreshing" : "Ready"} tone={loading ? "warning" : "good"} />
      <SignalRow label="Source" value={sourceLabel} tone={sourceTone} />
      <SignalRow label="Last updated" value={formatTimestamp(lastUpdatedAt)} />
      {endpoints.map((endpoint) => (
        <SignalRow
          key={endpoint.label}
          label={endpoint.label}
          value={endpoint.state === "live" ? "Live" : endpoint.state === "fallback" ? "Preview fallback" : "Disabled"}
          tone={endpoint.state === "live" ? "good" : endpoint.state === "fallback" ? "warning" : "neutral"}
        />
      ))}
      {endpoints.map((endpoint) => (
        <Text key={`${endpoint.label}-detail`} style={styles.detailLine}>{endpoint.label}: {endpoint.detail}</Text>
      ))}
      <Pressable style={[styles.button, loading ? styles.buttonDisabled : null]} onPress={onRefresh} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Refreshing Data" : "Refresh Data"}</Text>
      </Pressable>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.card,
    backgroundColor: palette.graphite
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: palette.paper,
    fontSize: 14,
    fontWeight: "700"
  },
  detailLine: {
    color: palette.inkSoft,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8
  }
});
