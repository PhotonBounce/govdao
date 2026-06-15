import { StyleSheet, Text, View } from "react-native";
import { SectionCard } from "../components/SectionCard";
import { ModulePill } from "../components/ModulePill";
import { Achievement, countEarned, reputationTier } from "../data/achievementsSource";
import { darkPalette, radii } from "../theme";

interface AchievementsScreenProps {
  achievements: Achievement[];
}

export function AchievementsScreen({ achievements }: AchievementsScreenProps) {
  const earned = countEarned(achievements);
  const tier = reputationTier(earned);

  return (
    <>
      <SectionCard tone="glass" eyebrow="Governance Reputation" title="Achievements" infoKey="achievements">
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.tier}>{tier}</Text>
            <Text style={styles.tierSub}>{earned} of {achievements.length} badges earned</Text>
          </View>
          <ModulePill label={`${Math.round((earned / achievements.length) * 100)}%`} tone={earned >= 4 ? "pine" : "bronze"} />
        </View>
      </SectionCard>

      <View style={styles.grid}>
        {achievements.map((a) => (
          <View key={a.id} style={[styles.badge, a.earned ? styles.badgeEarned : styles.badgeLocked]}>
            <Text style={[styles.glyph, !a.earned && styles.glyphLocked]}>{a.glyph}</Text>
            <Text style={styles.badgeTitle}>{a.title}</Text>
            <Text style={styles.badgeDesc}>{a.description}</Text>
            {a.earned ? (
              <ModulePill label="EARNED" tone="pine" />
            ) : (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${a.progress}%` as `${number}%` }]} />
              </View>
            )}
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tier: { color: darkPalette.softGold, fontSize: 22, fontWeight: "800" },
  tierSub: { color: "rgba(224,219,208,0.55)", fontSize: 12, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  badge: {
    width: "47%", borderRadius: radii.card, borderWidth: 1, padding: 14, gap: 6, alignItems: "flex-start",
  },
  badgeEarned: { backgroundColor: "rgba(201,131,64,0.08)", borderColor: darkPalette.glowBronze },
  badgeLocked: { backgroundColor: "rgba(255,255,255,0.03)", borderColor: darkPalette.mutedLine },
  glyph: { fontSize: 30 },
  glyphLocked: { opacity: 0.35 },
  badgeTitle: { color: darkPalette.dimWhite, fontSize: 14, fontWeight: "700" },
  badgeDesc: { color: "rgba(224,219,208,0.55)", fontSize: 11, lineHeight: 15 },
  progressTrack: { width: "100%", height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden", marginTop: 2 },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: darkPalette.softGold },
});
