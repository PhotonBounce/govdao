import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SectionCard } from "../components/SectionCard";
import { ModulePill } from "../components/ModulePill";
import {
  GovernanceCalendar,
  CalendarEvent,
  KIND_LABEL,
  groupEventsByDay,
  upcomingEvents,
  relativeTimeLabel,
  countByKind,
} from "../data/governanceCalendarSource";
import { darkPalette, radii } from "../theme";

interface GovernanceCalendarScreenProps {
  calendar: GovernanceCalendar;
  remindersCard?: import("react").ReactNode;
}

function EventRow({ event, nowMs }: { event: CalendarEvent; nowMs: number }) {
  const eta = new Date(event.etaMs);
  const time = `${String(eta.getUTCHours()).padStart(2, "0")}:${String(eta.getUTCMinutes()).padStart(2, "0")} UTC`;
  return (
    <View style={styles.eventRow}>
      <View style={[styles.eventDot, { backgroundColor: toneColor(event.tone) }]} />
      <View style={styles.eventBody}>
        <View style={styles.eventHeader}>
          <ModulePill label={KIND_LABEL[event.kind].toUpperCase()} tone={event.tone} />
          <Text style={styles.eventRel}>{relativeTimeLabel(nowMs, event.etaMs)}</Text>
        </View>
        <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.eventMeta}>{event.refId} · {time}</Text>
      </View>
    </View>
  );
}

function toneColor(tone: "pine" | "bronze" | "rose"): string {
  if (tone === "pine") return "#5c9b73";
  if (tone === "rose") return "#c06a64";
  return darkPalette.glowBronze;
}

export function GovernanceCalendarScreen({ calendar, remindersCard }: GovernanceCalendarScreenProps) {
  const nowMs = calendar.anchorMs;
  const upcoming = useMemo(() => upcomingEvents(calendar, nowMs), [calendar, nowMs]);
  const groups = useMemo(() => groupEventsByDay(upcoming), [upcoming]);
  const counts = useMemo(() => countByKind(upcoming), [upcoming]);

  return (
    <>
      <SectionCard tone="glass" eyebrow="What's Coming" title="Governance Calendar" infoKey="governance-calendar">
        <Text style={styles.lead}>
          {upcoming.length} upcoming event{upcoming.length === 1 ? "" : "s"} across voting, timelock and guardian schedules.
        </Text>
        <View style={styles.countRow}>
          <CountChip label="Voting" value={counts["voting-opens"] + counts["voting-closes"]} tone="pine" />
          <CountChip label="Timelock" value={counts["timelock-ready"]} tone="bronze" />
          <CountChip label="Guardian" value={counts["drill-window"]} tone="rose" />
          <CountChip label="Grace" value={counts["grace-expiry"]} tone="rose" />
        </View>
      </SectionCard>

      {remindersCard}

      {groups.map((group) => (
        <SectionCard key={group.isoDate} tone="glass" eyebrow={`${group.events.length} event${group.events.length === 1 ? "" : "s"}`} title={group.dayLabel} infoKey="governance-calendar">
          {group.events.map((event) => (
            <EventRow key={event.id} event={event} nowMs={nowMs} />
          ))}
        </SectionCard>
      ))}

      <Text style={styles.transportBadge}>
        {calendar.transport === "fixture" ? "· anchored to device time (fixture)" : "· anchored to chain block time (live)"}
      </Text>
    </>
  );
}

function CountChip({ label, value, tone }: { label: string; value: number; tone: "pine" | "bronze" | "rose" }) {
  return (
    <View style={styles.countChip}>
      <Text style={[styles.countValue, { color: toneColor(tone) }]}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: {
    color: darkPalette.dimWhite,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12
  },
  countRow: {
    flexDirection: "row",
    gap: 10
  },
  countChip: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: darkPalette.mutedLine,
    paddingVertical: 12,
    gap: 2
  },
  countValue: {
    fontSize: 22,
    fontWeight: "800"
  },
  countLabel: {
    color: "rgba(224,219,208,0.55)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  eventRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: darkPalette.mutedLine
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6
  },
  eventBody: {
    flex: 1,
    gap: 4
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  eventRel: {
    color: darkPalette.softGold,
    fontSize: 12,
    fontWeight: "700"
  },
  eventTitle: {
    color: darkPalette.dimWhite,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19
  },
  eventMeta: {
    color: "rgba(224,219,208,0.5)",
    fontSize: 11,
    fontVariant: ["tabular-nums"]
  },
  transportBadge: {
    color: "rgba(224,219,208,0.35)",
    fontSize: 11,
    marginTop: 4,
    textAlign: "right"
  }
});
