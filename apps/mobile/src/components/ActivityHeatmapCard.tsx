import { StyleSheet, Text, View } from "react-native";
import { SectionCard } from "./SectionCard";
import { ModulePill } from "./ModulePill";
import { ActivityHeatmap, weekColumns } from "../data/activityHeatmapSource";
import { darkPalette } from "../theme";

interface ActivityHeatmapCardProps {
  heatmap: ActivityHeatmap;
}

const INTENSITY_COLORS = [
  "rgba(255,255,255,0.05)",
  "rgba(201,131,64,0.30)",
  "rgba(201,131,64,0.55)",
  "rgba(201,131,64,0.80)",
  "#e8c87a",
];

export function ActivityHeatmapCard({ heatmap }: ActivityHeatmapCardProps) {
  const columns = weekColumns(heatmap);

  return (
    <SectionCard tone="glass" eyebrow="Contribution" title="Activity Heatmap" infoKey="activity-feed">
      <View style={styles.statsRow}>
        <View>
          <Text style={styles.bigStat}>{heatmap.total}</Text>
          <Text style={styles.statLabel}>actions · {heatmap.weeks}w</Text>
        </View>
        <ModulePill label={`${heatmap.currentStreak}-DAY STREAK`} tone={heatmap.currentStreak >= 3 ? "pine" : "bronze"} />
      </View>

      <View style={styles.grid}>
        {columns.map((col, ci) => (
          <View key={ci} style={styles.col}>
            {col.map((cell) => (
              <View key={cell.dayIndex} style={[styles.cell, { backgroundColor: INTENSITY_COLORS[cell.intensity] }]} />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        {INTENSITY_COLORS.map((c, i) => (
          <View key={i} style={[styles.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={styles.legendText}>More</Text>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  bigStat: { color: darkPalette.dimWhite, fontSize: 30, fontWeight: "800" },
  statLabel: { color: "rgba(224,219,208,0.5)", fontSize: 12 },
  grid: { flexDirection: "row", gap: 4, justifyContent: "space-between" },
  col: { gap: 4, flex: 1 },
  cell: { aspectRatio: 1, borderRadius: 2, width: "100%" },
  legend: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 12, justifyContent: "flex-end" },
  legendText: { color: "rgba(224,219,208,0.45)", fontSize: 10 },
  legendCell: { width: 11, height: 11, borderRadius: 2 },
});
