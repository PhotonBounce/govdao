import { StyleSheet, Text } from "react-native";
import { AnimatedPressable } from "./AnimatedPressable";
import { darkPalette, radii } from "../theme";

interface NavTabProps {
  active: boolean;
  label: string;
  onPress: () => void;
  /** Gold-tinted idle styling for a standout CTA (e.g. the Premium upsell tab). */
  accent?: boolean;
}

export function NavTab({ active, label, onPress, accent = false }: NavTabProps) {
  const idleStyle = accent ? styles.tabAccent : styles.tabIdle;
  const idleLabel = accent ? styles.labelAccent : styles.labelIdle;
  return (
    <AnimatedPressable
      onPress={onPress}
      sound="tap"
      intensity="subtle"
      accessibilityRole="tab"
      accessibilityLabel={`${label}${active ? ", selected" : ""}`}
      style={[styles.tab, active ? styles.tabActive : idleStyle]}
    >
      <Text style={[styles.label, active ? styles.labelActive : idleLabel]}>{label}</Text>
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
  tabAccent: {
    backgroundColor: "rgba(201,131,64,0.12)",
    borderColor: darkPalette.glowBronze
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
  },
  labelAccent: {
    color: darkPalette.softGold
  }
});