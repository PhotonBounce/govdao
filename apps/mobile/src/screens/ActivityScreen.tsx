import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { ActivityFeedPanel } from "../components/ActivityFeedPanel";
import { ActivityHeatmapCard } from "../components/ActivityHeatmapCard";
import { buildHeatmap } from "../data/activityHeatmapSource";
import { SectionCard } from "../components/SectionCard";
import {
  ActivityEventType,
  exportActivityCsv,
  exportActivityJson,
  filterActivityByDateRange,
  loadActivityFeed
} from "../data/activitySource";
import { AppManifest } from "../types";
import { darkPalette } from "../theme";
import { usePlanGate } from "../hooks/usePlanGate";

interface ActivityScreenProps {
  manifest: AppManifest;
}

type FilterOption = ActivityEventType | "all";
type DateRange = 7 | 30 | 90 | 0;

const FILTER_OPTIONS: Array<{ label: string; value: FilterOption }> = [
  { label: "All", value: "all" },
  { label: "Proposals", value: "proposal" },
  { label: "Votes", value: "vote" },
  { label: "Motions", value: "motion" },
  { label: "Treasury", value: "treasury" },
  { label: "Guardian", value: "guardian" }
];

const DATE_RANGES: Array<{ label: string; value: DateRange }> = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
  { label: "All time", value: 0 }
];

export function ActivityScreen({ manifest }: ActivityScreenProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [dateRange, setDateRange] = useState<DateRange>(0);
  const exportGate = usePlanGate(manifest, "activity-export");

  const result = loadActivityFeed(manifest, activeFilter);
  const visibleEvents = dateRange === 0
    ? result.events
    : filterActivityByDateRange(result.events, dateRange);

  function handleExportCsv() {
    if (!exportGate.allowed) {
      Alert.alert("Premium Feature", "Upgrade to GOVDAO Premium to export activity data.");
      return;
    }
    const csv = exportActivityCsv(visibleEvents);
    Alert.alert("Export Ready", `${visibleEvents.length} events (CSV)\n\n${csv.slice(0, 200)}…`, [
      { text: "OK" }
    ]);
  }

  function handleExportJson() {
    if (!exportGate.allowed) {
      Alert.alert("Premium Feature", "Upgrade to GOVDAO Premium to export activity data.");
      return;
    }
    const json = exportActivityJson(visibleEvents);
    Alert.alert("Export Ready", `${visibleEvents.length} events (JSON)\n\n${json.slice(0, 200)}…`, [
      { text: "OK" }
    ]);
  }

  return (
    <>
      <ActivityHeatmapCard heatmap={buildHeatmap(12, 7)} />
      <SectionCard
        tone="glass"
        eyebrow="Governance Timeline"
        title="Activity Log"
        subtitle="All governance actions sorted most-recent first."
        infoKey="activity-feed"
      >
        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.pill, activeFilter === option.value && styles.pillActive]}
              onPress={() => setActiveFilter(option.value)}
            >
              <Text style={[styles.pillText, activeFilter === option.value && styles.pillTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.dateRow}>
          {DATE_RANGES.map((range) => (
            <Pressable
              key={range.value}
              style={[styles.datePill, dateRange === range.value && styles.datePillActive]}
              onPress={() => setDateRange(range.value)}
            >
              <Text style={[styles.datePillText, dateRange === range.value && styles.datePillTextActive]}>
                {range.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.exportRow}>
          <Text style={styles.countLine}>
            {visibleEvents.length} event{visibleEvents.length !== 1 ? "s" : ""}
            {result.transport === "fixture" ? " · fixture" : ""}
          </Text>
          <View style={styles.exportBtns}>
            <Pressable style={[styles.exportBtn, !exportGate.allowed && styles.exportBtnLocked]} onPress={handleExportCsv}>
              <Text style={styles.exportBtnText}>{exportGate.allowed ? "CSV" : "🔒 CSV"}</Text>
            </Pressable>
            <Pressable style={[styles.exportBtn, !exportGate.allowed && styles.exportBtnLocked]} onPress={handleExportJson}>
              <Text style={styles.exportBtnText}>{exportGate.allowed ? "JSON" : "🔒 JSON"}</Text>
            </Pressable>
          </View>
        </View>

        <ActivityFeedPanel events={visibleEvents} />
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: darkPalette.mutedLine,
    backgroundColor: "transparent"
  },
  pillActive: {
    backgroundColor: darkPalette.activeGlow,
    borderColor: darkPalette.glowBronze
  },
  pillText: {
    color: "rgba(224,219,208,0.6)",
    fontSize: 13,
    fontWeight: "600"
  },
  pillTextActive: {
    color: darkPalette.softGold
  },
  dateRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12
  },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkPalette.mutedLine
  },
  datePillActive: {
    backgroundColor: "rgba(201,131,64,0.12)",
    borderColor: darkPalette.glowBronze
  },
  datePillText: {
    color: "rgba(224,219,208,0.5)",
    fontSize: 12,
    fontWeight: "500"
  },
  datePillTextActive: {
    color: darkPalette.glowBronze
  },
  exportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  countLine: {
    color: "rgba(224,219,208,0.5)",
    fontSize: 13
  },
  exportBtns: {
    flexDirection: "row",
    gap: 6
  },
  exportBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkPalette.glowBronze,
    backgroundColor: "rgba(201,131,64,0.1)"
  },
  exportBtnLocked: {
    borderColor: darkPalette.mutedLine,
    backgroundColor: "transparent"
  },
  exportBtnText: {
    color: darkPalette.softGold,
    fontSize: 12,
    fontWeight: "600"
  }
});
