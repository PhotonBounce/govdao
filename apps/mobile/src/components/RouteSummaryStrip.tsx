import { StyleSheet, Text, View } from "react-native";
import { palette, radii } from "../theme";

interface RouteSignal {
  label: string;
  value: string;
  tone?: "good" | "warning" | "neutral";
}

interface RouteSummaryStripProps {
  signals: RouteSignal[];
}

function getToneColor(tone: RouteSignal["tone"]) {
  if (tone === "good") {
    return palette.pine;
  }

  if (tone === "warning") {
    return palette.rose;
  }

  return palette.moss;
}

export function RouteSummaryStrip({ signals }: RouteSummaryStripProps) {
  return (
    <View style={styles.grid}>
      {signals.map((signal) => (
        <View key={signal.label} style={styles.card}>
          <Text style={styles.label}>{signal.label}</Text>
          <Text style={styles.value}>{signal.value}</Text>
          <Text style={[styles.tone, { color: getToneColor(signal.tone) }]}>{signal.tone ?? "neutral"}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14
  },
  card: {
    flex: 1,
    padding: 12,
    borderRadius: radii.card,
    backgroundColor: "rgba(217, 205, 184, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(142, 92, 50, 0.12)"
  },
  label: {
    color: palette.inkSoft,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6
  },
  value: {
    color: palette.graphite,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4
  },
  tone: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize"
  }
});