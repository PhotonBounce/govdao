import { StyleSheet, View } from "react-native";
import { darkPalette } from "../theme";

/** A pill toggle that mirrors an on/off state. Purely visual — wrap it in a
 * pressable with accessibilityRole="switch" + accessibilityChecked. */
export function PillToggle({ on }: { on: boolean }) {
  return (
    <View style={[styles.track, on ? styles.trackOn : styles.trackOff]}>
      <View style={[styles.knob, on ? styles.knobOn : styles.knobOff]} />
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
});
