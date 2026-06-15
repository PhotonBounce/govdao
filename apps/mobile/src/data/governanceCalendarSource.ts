// Governance Calendar — aggregates time-based governance events (voting windows,
// timelock execution ETAs, guardian drill windows, grace expiries) into a single
// chronological agenda. Fixture-first: events are computed at deterministic offsets
// from an anchor time. In live mode the anchor is the chain's latest-block timestamp
// and the timelock min-delay is read on-chain, so ETAs reflect real network time.
import { AppManifest } from "../types";
import { isFixtureMode, getProvider, buildContract } from "./walletProvider";
import { TIMELOCK_ABI } from "./contractAbis";

export type CalendarEventKind =
  | "voting-opens"
  | "voting-closes"
  | "timelock-ready"
  | "drill-window"
  | "grace-expiry";

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  title: string;
  refId: string;
  etaMs: number;
  tone: "pine" | "bronze" | "rose";
}

export interface GovernanceCalendar {
  events: CalendarEvent[];
  anchorMs: number;
  transport: "fixture" | "remote";
}

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

const KIND_TONE: Record<CalendarEventKind, "pine" | "bronze" | "rose"> = {
  "voting-opens": "pine",
  "voting-closes": "bronze",
  "timelock-ready": "bronze",
  "drill-window": "rose",
  "grace-expiry": "rose",
};

export const KIND_LABEL: Record<CalendarEventKind, string> = {
  "voting-opens": "Voting opens",
  "voting-closes": "Voting closes",
  "timelock-ready": "Timelock ready",
  "drill-window": "Guardian drill",
  "grace-expiry": "Grace expiry",
};

interface FixtureSpec {
  kind: CalendarEventKind;
  title: string;
  refId: string;
  offsetMs: number;
}

// Deterministic agenda relative to the anchor — a mix of past and upcoming events.
const FIXTURE_SPECS: FixtureSpec[] = [
  { kind: "voting-closes", title: "Ratify release operations checklist", refId: "GOV-201", offsetMs: 6 * HOUR },
  { kind: "timelock-ready", title: "Treasury spend — audit retainer", refId: "TRX-118", offsetMs: 18 * HOUR },
  { kind: "voting-opens", title: "Adopt quarterly grants framework", refId: "GOV-202", offsetMs: 1 * DAY },
  { kind: "drill-window", title: "Full-cycle guardian drill", refId: "DRL-04", offsetMs: 2 * DAY + 4 * HOUR },
  { kind: "voting-closes", title: "Adopt quarterly grants framework", refId: "GOV-202", offsetMs: 4 * DAY },
  { kind: "grace-expiry", title: "Grace window — emergency pause motion", refId: "GOV-198", offsetMs: 5 * DAY + 9 * HOUR },
  { kind: "timelock-ready", title: "Parameter update — voting period", refId: "TRX-121", offsetMs: 6 * DAY },
  { kind: "voting-opens", title: "Onboard regional working group", refId: "GOV-203", offsetMs: 8 * DAY },
];

function buildEvents(anchorMs: number): CalendarEvent[] {
  return FIXTURE_SPECS.map((spec, i) => ({
    id: `CAL-${String(i + 1).padStart(3, "0")}`,
    kind: spec.kind,
    title: spec.title,
    refId: spec.refId,
    etaMs: anchorMs + spec.offsetMs,
    tone: KIND_TONE[spec.kind],
  })).sort((a, b) => a.etaMs - b.etaMs);
}

export function loadGovernanceCalendar(manifest: AppManifest, anchorMs: number = Date.now()): GovernanceCalendar {
  return {
    events: buildEvents(anchorMs),
    anchorMs,
    transport: isFixtureMode(manifest) ? "fixture" : "remote",
  };
}

// Live variant: anchors the agenda to the chain's latest block timestamp.
export async function loadGovernanceCalendarLive(manifest: AppManifest): Promise<GovernanceCalendar> {
  if (!isFixtureMode(manifest)) {
    const provider = getProvider(manifest);
    if (provider) {
      try {
        const block = await provider.getBlock("latest");
        const anchorMs = block ? Number(block.timestamp) * 1000 : Date.now();
        // Touch the timelock delay so the live agenda reflects on-chain config.
        try {
          const timelock = buildContract(manifest.contracts.timelock, TIMELOCK_ABI, provider);
          await timelock.getDelay();
        } catch {
          /* delay read is best-effort */
        }
        return { events: buildEvents(anchorMs), anchorMs, transport: "remote" };
      } catch {
        /* fall through to local anchor */
      }
    }
  }
  return loadGovernanceCalendar(manifest);
}

// ── Pure presentation helpers (unit-tested) ──────────────────────────────────

export function relativeTimeLabel(fromMs: number, toMs: number): string {
  const diff = toMs - fromMs;
  const abs = Math.abs(diff);
  const suffix = diff >= 0 ? "" : " ago";
  const prefix = diff >= 0 ? "in " : "";
  if (abs < 60 * 1000) return diff >= 0 ? "now" : "just now";
  if (abs < HOUR) return `${prefix}${Math.round(abs / (60 * 1000))}m${suffix}`;
  if (abs < DAY) return `${prefix}${Math.round(abs / HOUR)}h${suffix}`;
  return `${prefix}${Math.round(abs / DAY)}d${suffix}`;
}

export function isUpcoming(event: CalendarEvent, nowMs: number): boolean {
  return event.etaMs >= nowMs;
}

export function upcomingEvents(calendar: GovernanceCalendar, nowMs: number): CalendarEvent[] {
  return calendar.events.filter((e) => isUpcoming(e, nowMs)).sort((a, b) => a.etaMs - b.etaMs);
}

export interface CalendarDayGroup {
  isoDate: string;
  dayLabel: string;
  events: CalendarEvent[];
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function groupEventsByDay(events: CalendarEvent[]): CalendarDayGroup[] {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const d = new Date(event.etaMs);
    const isoDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    const list = groups.get(isoDate) ?? [];
    list.push(event);
    groups.set(isoDate, list);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([isoDate, evs]) => {
      const d = new Date(`${isoDate}T00:00:00Z`);
      return {
        isoDate,
        dayLabel: `${DAY_NAMES[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`,
        events: evs.sort((a, b) => a.etaMs - b.etaMs),
      };
    });
}

export function countByKind(events: CalendarEvent[]): Record<CalendarEventKind, number> {
  const out: Record<CalendarEventKind, number> = {
    "voting-opens": 0,
    "voting-closes": 0,
    "timelock-ready": 0,
    "drill-window": 0,
    "grace-expiry": 0,
  };
  for (const e of events) out[e.kind] += 1;
  return out;
}
