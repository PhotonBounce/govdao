import { StyleSheet, Text, View } from "react-native";
import { radii } from "../theme";

interface RouteSignal {
  label: string;
  value: string;
  tone?: "good" | "warning" | "neutral";
}

interface RouteSummaryStripProps {
  signals: RouteSignal[];
}

// Dark-legible tone colors — this strip renders over the dark shell.
function getToneColor(tone: RouteSignal["tone"]) {
  if (tone === "good") {
    return "#4caf82";
  }

  if (tone === "warning") {
    return "#e08a7a";
  }

  return "#9a8f7c";
}

export function RouteSummaryStrip({ signals }: RouteSummaryStripProps) {
  return (
    <View style={styles.grid}>
      {signals.map((signal) => (
        <View key={signal.label} style={styles.card}>
          <Text style={styles.label}>{signal.label}</Text>
          <Text style={styles.value} numberOfLines={2}>{signal.value}</Text>
          <Text style={[styles.tone, { color: getToneColor(signal.tone) }]}>{signal.tone ?? "neutral"}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14
  },
  card: {
    flexGrow: 1,
    flexBasis: 104,
    minWidth: 104,
    padding: 12,
    borderRadius: radii.card,
    backgroundColor: "rgba(20, 20, 36, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(201, 131, 64, 0.18)"
  },
  label: {
    color: "rgba(224, 219, 208, 0.55)",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6
  },
  value: {
    color: "#e8e4d8",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4
  },
  tone: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize"
  }
});
