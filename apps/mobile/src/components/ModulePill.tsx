import { StyleSheet, Text, View } from "react-native";
import { palette, radii } from "../theme";

interface ModulePillProps {
  label: string;
  tone?: "bronze" | "pine" | "rose";
}

export function ModulePill({ label, tone = "bronze" }: ModulePillProps) {
  const backgroundColor = tone === "pine" ? palette.pine : tone === "rose" ? palette.rose : palette.bronze;

  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: "flex-start",
    marginRight: 8,
    marginBottom: 8
  },
  label: {
    color: palette.white,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3
  }
});