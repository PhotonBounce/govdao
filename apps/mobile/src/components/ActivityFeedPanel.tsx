import { StyleSheet, Text, View } from "react-native";
import { ActivityEvent, eventTypeLabel, eventTypeTone } from "../data/activitySource";
import { ModulePill } from "./ModulePill";
import { palette } from "../theme";

interface ActivityFeedPanelProps {
  events: ActivityEvent[];
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ActivityFeedPanel({ events }: ActivityFeedPanelProps) {
  if (events.length === 0) {
    return <Text style={styles.emptyLine}>No activity events are available from the active feed yet.</Text>;
  }

  return (
    <>
      {events.map((event) => (
        <View key={event.id} style={styles.eventRow}>
          <View style={styles.eventTopRow}>
            <ModulePill label={eventTypeLabel(event.type)} tone={eventTypeTone(event.type)} />
            <Text style={styles.timestamp}>{formatTimestamp(event.timestamp)}</Text>
          </View>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.actor}>{event.actor}</Text>
          <Text style={styles.summary}>{event.summary}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  eventRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(93, 81, 72, 0.12)"
  },
  eventTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  timestamp: {
    color: palette.inkSoft,
    fontSize: 12
  },
  eventTitle: {
    color: palette.graphite,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2
  },
  actor: {
    color: palette.bronze,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4
  },
  summary: {
    color: palette.inkSoft,
    fontSize: 13,
    lineHeight: 18
  },
  emptyLine: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20
  }
});
