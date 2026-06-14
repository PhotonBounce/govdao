import { StyleSheet, Text, View } from "react-native";
import { ProposalTimeline, TimelineEntry, timelineStateTone, timelineStateLabel } from "../data/proposalTimelineSource";
import { ModulePill } from "./ModulePill";
import { palette } from "../theme";

interface ProposalTimelinePanelProps {
  timeline: ProposalTimeline;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function TimelineRow({ entry, isLast, isCurrent }: { entry: TimelineEntry; isLast: boolean; isCurrent: boolean }) {
  const tone = timelineStateTone(entry.state);
  return (
    <View style={styles.row}>
      <View style={styles.track}>
        <View style={[styles.dot, isCurrent && styles.dotCurrent]} />
        {!isLast ? <View style={styles.connector} /> : null}
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <ModulePill label={timelineStateLabel(entry.state)} tone={tone} />
          {isCurrent ? <ModulePill label="CURRENT" tone="pine" /> : null}
        </View>
        <Text style={styles.label}>{entry.label}</Text>
        <Text style={styles.timestamp}>{formatTimestamp(entry.timestamp)}</Text>
        {entry.note ? <Text style={styles.note}>{entry.note}</Text> : null}
        {entry.txHash ? (
          <Text style={styles.hash}>{entry.txHash.slice(0, 10)}…{entry.txHash.slice(-6)}</Text>
        ) : null}
      </View>
    </View>
  );
}

export function ProposalTimelinePanel({ timeline }: ProposalTimelinePanelProps) {
  return (
    <>
      {timeline.entries.map((entry, i) => (
        <TimelineRow
          key={entry.state}
          entry={entry}
          isLast={i === timeline.entries.length - 1}
          isCurrent={entry.state === timeline.currentState}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4
  },
  track: {
    alignItems: "center",
    width: 16
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.bronze,
    marginTop: 6
  },
  dotCurrent: {
    backgroundColor: palette.pine,
    width: 14,
    height: 14,
    borderRadius: 7
  },
  connector: {
    width: 2,
    flex: 1,
    backgroundColor: palette.line,
    marginTop: 4,
    marginBottom: -4
  },
  content: {
    flex: 1,
    paddingBottom: 14
  },
  topRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4
  },
  label: {
    color: palette.graphite,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2
  },
  timestamp: {
    color: palette.inkSoft,
    fontSize: 12,
    marginBottom: 2
  },
  note: {
    color: palette.moss,
    fontSize: 12,
    marginTop: 2
  },
  hash: {
    color: palette.bronze,
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: 2
  }
});
