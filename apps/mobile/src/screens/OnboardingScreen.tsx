import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedButton } from "../components/AnimatedButton";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { ONBOARDING_STEPS, isFirstStep, isLastStep, nextStep, prevStep, stepProgress } from "../data/onboardingSource";
import { darkPalette } from "../theme";

interface OnboardingScreenProps {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [index, setIndex] = useState(0);
  const step = ONBOARDING_STEPS[index];
  const last = isLastStep(index);
  const first = isFirstStep(index);

  return (
    <View style={styles.container}>
      <AnimatedPressable onPress={onDone} sound="tap" intensity="subtle" style={styles.skip}>
        <Text style={styles.skipText}>{last ? "" : "Skip"}</Text>
      </AnimatedPressable>

      <View style={styles.body}>
        <View style={styles.glyphRing}>
          <Text style={styles.glyph}>{step.glyph}</Text>
        </View>
        <Text style={styles.stepCounter}>Step {index + 1} of {ONBOARDING_STEPS.length}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.text}>{step.body}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {ONBOARDING_STEPS.map((s, i) => (
            <AnimatedPressable
              key={s.id}
              onPress={() => setIndex(i)}
              sound="tap"
              intensity="subtle"
              style={styles.dotHit}
            >
              <View style={[styles.dot, i === index ? styles.dotActive : null]} />
            </AnimatedPressable>
          ))}
        </View>
        <Text style={styles.progress}>{stepProgress(index)}%</Text>
        <View style={styles.buttonRow}>
          {!first ? (
            <View style={styles.buttonFlex}>
              <AnimatedButton label="Back" variant="ghost" onPress={() => setIndex(prevStep(index))} />
            </View>
          ) : null}
          <View style={styles.buttonFlex}>
            <AnimatedButton
              label={last ? "Connect & start →" : "Next"}
              variant="primary"
              pulse={last}
              onPress={() => (last ? onDone() : setIndex(nextStep(index)))}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 72, paddingBottom: 40, justifyContent: "space-between", backgroundColor: "#080810" },
  skip: { alignSelf: "flex-end", paddingVertical: 6, paddingHorizontal: 10, minHeight: 28 },
  skipText: { color: darkPalette.softGold, fontSize: 14, fontWeight: "700" },
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  glyphRing: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: darkPalette.glowBronze,
    alignItems: "center", justifyContent: "center", backgroundColor: "rgba(201,131,64,0.08)",
  },
  glyph: { fontSize: 48, color: darkPalette.softGold },
  stepCounter: { color: darkPalette.softGold, fontSize: 12, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
  title: { fontSize: 28, fontWeight: "800", color: darkPalette.dimWhite, textAlign: "center", letterSpacing: 0.3 },
  text: { fontSize: 15, lineHeight: 23, color: "rgba(224,219,208,0.72)", textAlign: "center", paddingHorizontal: 6 },
  footer: { gap: 16 },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  dotHit: { padding: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.18)" },
  dotActive: { backgroundColor: darkPalette.glowBronze, width: 22 },
  progress: { color: "rgba(224,219,208,0.45)", fontSize: 12, textAlign: "center" },
  buttonRow: { flexDirection: "row", gap: 12 },
  buttonFlex: { flex: 1 },
});
