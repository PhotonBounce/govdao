import { StyleSheet, Text, View } from "react-native";
import { palette } from "../theme";

interface SignalRowProps {
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "good";
  /** Set when the row renders on a dark (graphite) card so text stays legible. */
  onDark?: boolean;
}

export function SignalRow({ label, value, tone = "neutral", onDark = false }: SignalRowProps) {
  const valueColor = tone === "warning"
    ? (onDark ? "#e08a7a" : palette.rose)
    : tone === "good"
      ? (onDark ? "#4caf82" : palette.pine)
      : (onDark ? "#e8e4d8" : palette.graphite);
  const labelColor = onDark ? "rgba(224, 219, 208, 0.6)" : palette.inkSoft;

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(93, 81, 72, 0.12)"
  },
  label: {
    fontSize: 14,
    color: palette.inkSoft,
    flex: 1,
    paddingRight: 12
  },
  value: {
    fontSize: 14,
    fontWeight: "700"
  }
});