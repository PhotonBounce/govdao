import { Pressable, StyleSheet, Text } from "react-native";
import { SectionCard } from "./SectionCard";
import { SignalRow } from "./SignalRow";
import { DashboardEndpointStatus } from "../data/mobileDataSource";
import { palette, radii } from "../theme";

interface DataStatusCardProps {
  loading: boolean;
  source: "mock" | "remote" | "fixture" | "mixed";
  syncMessage: string;
  lastUpdatedAt: string;
  endpoints: DashboardEndpointStatus[];
  onRefresh: () => void;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function getModeCallout(source: DataStatusCardProps["source"]) {
  if (source === "remote") {
    return {
      title: "Live service mode",
      body: "This session is reading configured governance services directly, so operator checks reflect current backend behavior.",
      tone: "good" as const
    };
  }

  if (source === "fixture") {
    return {
      title: "Fixture mode active",
      body: "This session is exercising the normalized dashboard loader against fixture-backed feeds, not a live backend.",
      tone: "warning" as const
    };
  }

  if (source === "mixed") {
    return {
      title: "Mixed data mode",
      body: "Some dashboard routes are live or fixture-backed while others are falling back, so this screen should not be treated as fully production-shaped.",
      tone: "warning" as const
    };
  }

  return {
    title: "Preview mode active",
    body: "This session is using local preview records because configured feeds are not yet available for the active manifest.",
    tone: "neutral" as const
  };
}

export function DataStatusCard({ loading, source, syncMessage, lastUpdatedAt, endpoints, onRefresh }: DataStatusCardProps) {
  const title = source === "remote"
    ? "Live Service Feed"
    : source === "fixture"
      ? "Fixture-backed Feed"
    : source === "mixed"
      ? "Live Feed With Preview Fallback"
      : "Preview Data Feed";
  const sourceLabel = source === "remote"
    ? "Remote services"
    : source === "fixture"
      ? "Fixture-backed API"
    : source === "mixed"
      ? "Remote and preview"
      : "Local preview";
  const sourceTone = source === "remote" ? "good" : source === "mixed" ? "warning" : "neutral";
  const callout = getModeCallout(source);

  return (
    <SectionCard
      eyebrow="Data Source"
      title={title}
      subtitle={syncMessage}
    >
      <Text style={[styles.calloutTitle, callout.tone === "good" ? styles.calloutTitleGood : callout.tone === "warning" ? styles.calloutTitleWarning : styles.calloutTitleNeutral]}>{callout.title}</Text>
      <Text style={styles.calloutBody}>{callout.body}</Text>
      <SignalRow label="Sync status" value={loading ? "Refreshing" : "Ready"} tone={loading ? "warning" : "good"} />
      <SignalRow label="Source" value={sourceLabel} tone={sourceTone} />
      <SignalRow label="Last updated" value={formatTimestamp(lastUpdatedAt)} />
      {endpoints.map((endpoint) => (
        <SignalRow
          key={endpoint.label}
          label={endpoint.label}
          value={endpoint.state === "live" ? "Live" : endpoint.state === "fixture" ? "Fixture" : endpoint.state === "fallback" ? "Preview fallback" : "Disabled"}
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
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6
  },
  calloutTitleGood: {
    color: palette.pine
  },
  calloutTitleWarning: {
    color: palette.rose
  },
  calloutTitleNeutral: {
    color: palette.moss
  },
  calloutBody: {
    color: palette.inkSoft,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10
  }
});
