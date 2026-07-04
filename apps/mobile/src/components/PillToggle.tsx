import { StyleSheet, View } from "react-native";
import { darkPalette } from "../theme";

/** A pill toggle that mirrors an on/off state. Purely visual — wrap it in a
 * pressable with accessibilityRole="switch" + accessibilityChecked.
 * Use variant="light" on cream/paper cards so the off state stays visible. */
export function PillToggle({ on, variant = "dark" }: { on: boolean; variant?: "dark" | "light" }) {
  const offTrack = variant === "light" ? styles.trackOffLight : styles.trackOff;
  const offKnob = variant === "light" ? styles.knobOffLight : styles.knobOff;
  return (
    <View style={[styles.track, on ? styles.trackOn : offTrack]}>
      <View style={[styles.knob, on ? styles.knobOn : offKnob]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: "center",
  },
  trackOn: {
    backgroundColor: darkPalette.glowBronze,
  },
  trackOff: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  trackOffLight: {
    backgroundColor: "rgba(93, 81, 72, 0.28)",
    borderWidth: 1,
    borderColor: "rgba(93, 81, 72, 0.35)",
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  knobOn: {
    backgroundColor: "#0d0d1a",
    alignSelf: "flex-end",
  },
  knobOff: {
    backgroundColor: "rgba(224,219,208,0.85)",
    alignSelf: "flex-start",
  },
  knobOffLight: {
    backgroundColor: "#6b6155",
    alignSelf: "flex-start",
  },
});
