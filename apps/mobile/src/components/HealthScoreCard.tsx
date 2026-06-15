import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { SectionCard } from "./SectionCard";
import { ModulePill } from "./ModulePill";
import { HealthScore } from "../data/healthScoreSource";
import { darkPalette } from "../theme";

interface HealthScoreCardProps {
  health: HealthScore;
}

function gradeTone(grade: HealthScore["grade"]): "pine" | "bronze" | "rose" {
  if (grade === "A" || grade === "B") return "pine";
  if (grade === "C") return "bronze";
  return "rose";
}

export function HealthScoreCard({ health }: HealthScoreCardProps) {
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fill, { toValue: health.score, duration: 900, useNativeDriver: false }).start();
  }, [health.score, fill]);

  const width = fill.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  return (
    <SectionCard tone="glass" eyebrow="DAO Vitals" title="Governance Health" infoKey="health-score">
      <View style={styles.scoreRow}>
        <Text style={styles.score}>{health.score}</Text>
        <View style={styles.gradeBlock}>
          <Text style={[styles.grade, { color: gradeTone(health.grade) === "rose" ? "#c06a64" : darkPalette.softGold }]}>{health.grade}</Text>
          <ModulePill label={health.label.toUpperCase()} tone={gradeTone(health.grade)} />
        </View>
      </View>

      <View style={styles.meterTrack}>
        <Animated.View style={[styles.meterFill, { width }]} />
      </View>

      <View style={styles.factors}>
        {health.factors.map((f) => (
          <View key={f.id} style={styles.factorRow}>
            <Text style={styles.factorLabel}>{f.label}</Text>
            <View style={styles.factorBarTrack}>
              <View style={[styles.factorBarFill, { width: `${f.value}%` as `${number}%` }]} />
            </View>
            <Text style={styles.factorValue}>{f.value}</Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  score: { fontSize: 56, fontWeight: "800", color: darkPalette.dimWhite, letterSpacing: -1 },
  gradeBlock: { alignItems: "flex-end", gap: 6 },
  grade: { fontSize: 40, fontWeight: "800" },
  meterTrack: { height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 16 },
  meterFill: { height: "100%", borderRadius: 6, backgroundColor: darkPalette.glowBronze },
  factors: { gap: 9 },
  factorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  factorLabel: { color: "rgba(224,219,208,0.7)", fontSize: 12, width: 96 },
  factorBarTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  factorBarFill: { height: "100%", borderRadius: 3, backgroundColor: darkPalette.softGold },
  factorValue: { color: darkPalette.dimWhite, fontSize: 12, fontWeight: "600", width: 26, textAlign: "right", fontVariant: ["tabular-nums"] },
});
