import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ActivityFeedPanel } from "../components/ActivityFeedPanel";
import { SectionCard } from "../components/SectionCard";
import { ActivityEventType, loadActivityFeed } from "../data/activitySource";
import { AppManifest } from "../types";
import { palette } from "../theme";

interface ActivityScreenProps {
  manifest: AppManifest;
}

type FilterOption = ActivityEventType | "all";

const FILTER_OPTIONS: Array<{ label: string; value: FilterOption }> = [
  { label: "All", value: "all" },
  { label: "Proposals", value: "proposal" },
  { label: "Votes", value: "vote" },
  { label: "Motions", value: "motion" },
  { label: "Treasury", value: "treasury" },
  { label: "Guardian", value: "guardian" }
];

export function ActivityScreen({ manifest }: ActivityScreenProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const result = loadActivityFeed(manifest, activeFilter);

  return (
    <>
      <SectionCard
        eyebrow="Governance Timeline"
        title="Activity Log"
        subtitle="All governance actions — proposals, votes, motions, treasury movements, and guardian events — sorted most-recent first."
      >
        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.filterPill, activeFilter === option.value && styles.filterPillActive]}
              onPress={() => setActiveFilter(option.value)}
            >
              <Text
                style={[styles.filterPillText, activeFilter === option.value && styles.filterPillTextActive]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.countLine}>
          {result.total} event{result.total !== 1 ? "s" : ""}
          {result.transport === "fixture" ? " · fixture" : ""}
        </Text>
        <ActivityFeedPanel events={result.events} />
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: "transparent"
  },
  filterPillActive: {
    backgroundColor: palette.graphite,
    borderColor: palette.graphite
  },
  filterPillText: {
    color: palette.graphite,
    fontSize: 13,
    fontWeight: "600"
  },
  filterPillTextActive: {
    color: palette.paper
  },
  countLine: {
    color: palette.inkSoft,
    fontSize: 13,
    marginBottom: 8
  }
});
