import { StyleSheet, Text, View } from "react-native";
import { SectionCard } from "./SectionCard";
import { AnimatedPressable } from "./AnimatedPressable";
import { usePreferences } from "../contexts/PreferencesContext";
import { PREFERENCE_META, PREFERENCE_ORDER, summarizePreferences } from "../data/preferencesSource";
import { darkPalette } from "../theme";

/** A pill toggle that mirrors the on/off state of one preference. */
function Toggle({ on }: { on: boolean }) {
  return (
    <View style={[styles.track, on ? styles.trackOn : styles.trackOff]}>
      <View style={[styles.knob, on ? styles.knobOn : styles.knobOff]} />
    </View>
  );
}

export function PreferencesPanel() {
  const { prefs, toggle } = usePreferences();

  return (
    <SectionCard tone="glass" eyebrow="Experience" title="Preferences" infoKey="preferences">
      <Text style={styles.summary}>{summarizePreferences(prefs)}</Text>
      {PREFERENCE_ORDER.map((key) => {
        const meta = PREFERENCE_META[key];
        const on = prefs[key];
        return (
          <AnimatedPressable
            key={key}
            onPress={() => toggle(key)}
            sound="tap"
            intensity="subtle"
            style={styles.row}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{meta.label}</Text>
              <Text style={styles.rowDesc}>{meta.description}</Text>
            </View>
            <Toggle on={on} />
          </AnimatedPressable>
        );
      })}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  summary: {
    color: darkPalette.softGold,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkPalette.mutedLine,
    gap: 12,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowLabel: {
    color: darkPalette.dimWhite,
    fontSize: 15,
    fontWeight: "700",
  },
  rowDesc: {
    color: "rgba(224,219,208,0.55)",
    fontSize: 12,
    lineHeight: 17,
  },
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
