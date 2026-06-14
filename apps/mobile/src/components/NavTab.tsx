import { StyleSheet, Text } from "react-native";
import { AnimatedPressable } from "./AnimatedPressable";
import { darkPalette, radii } from "../theme";

interface NavTabProps {
  active: boolean;
  label: string;
  onPress: () => void;
}

export function NavTab({ active, label, onPress }: NavTabProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      sound="tap"
      intensity="subtle"
      style={[styles.tab, active ? styles.tabActive : styles.tabIdle]}
    >
      <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1
  },
  tabActive: {
    backgroundColor: darkPalette.activeGlow,
    borderColor: darkPalette.glowBronze
  },
  tabIdle: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: darkPalette.mutedLine
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4
  },
  labelActive: {
    color: darkPalette.softGold
  },
  labelIdle: {
    color: "rgba(224,219,208,0.60)"
  }
});