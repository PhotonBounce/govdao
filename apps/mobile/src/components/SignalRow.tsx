import { StyleSheet, Text, View } from "react-native";
import { palette } from "../theme";

interface SignalRowProps {
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "good";
}

export function SignalRow({ label, value, tone = "neutral" }: SignalRowProps) {
  const valueColor = tone === "warning" ? palette.rose : tone === "good" ? palette.pine : palette.graphite;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
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