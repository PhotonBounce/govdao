import { GovernanceCalendar, CalendarEvent, KIND_LABEL } from "./governanceCalendarSource";

export interface GovernanceReminder {
  id: string;
  eventId: string;
  title: string;
  body: string;
  triggerMs: number;
  leadMs: number;
  channelId: string;
}

// Remind 24h and 1h before each governance event.
export const REMINDER_LEADS_MS = [24 * 3600 * 1000, 1 * 3600 * 1000];

const KIND_CHANNEL: Record<string, string> = {
  "voting-opens": "votes",
  "voting-closes": "votes",
  "timelock-ready": "governance",
  "drill-window": "guardian",
  "grace-expiry": "governance",
};

function leadLabel(leadMs: number): string {
  return leadMs >= 24 * 3600 * 1000 ? "in 24 hours" : "in 1 hour";
}

function reminderTitle(event: CalendarEvent, leadMs: number): string {
  return `${KIND_LABEL[event.kind]} ${leadLabel(leadMs)}`;
}

function reminderBody(event: CalendarEvent): string {
  return `${event.title} (${event.refId})`;
}

/**
 * Build the set of local reminders to schedule from a governance calendar — one per
 * (event, lead-time) pair whose trigger is still in the future. Pure and deterministic.
 */
export function buildReminders(calendar: GovernanceCalendar, nowMs: number): GovernanceReminder[] {
  const reminders: GovernanceReminder[] = [];
  for (const event of calendar.events) {
    for (const leadMs of REMINDER_LEADS_MS) {
      const triggerMs = event.etaMs - leadMs;
      if (triggerMs <= nowMs) continue;
      reminders.push({
        id: `${event.id}-${leadMs}`,
        eventId: event.id,
        title: reminderTitle(event, leadMs),
        body: reminderBody(event),
        triggerMs,
        leadMs,
        channelId: KIND_CHANNEL[event.kind] ?? "governance",
      });
    }
  }
  return reminders.sort((a, b) => a.triggerMs - b.triggerMs);
}

export function countUpcomingReminders(calendar: GovernanceCalendar, nowMs: number): number {
  return buildReminders(calendar, nowMs).length;
}

/** Seconds from now until the trigger — what expo-notifications' time-interval trigger wants. */
export function secondsUntilTrigger(reminder: GovernanceReminder, nowMs: number): number {
  return Math.max(1, Math.round((reminder.triggerMs - nowMs) / 1000));
}
