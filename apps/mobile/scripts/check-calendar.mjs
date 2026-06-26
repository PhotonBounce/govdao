/**
 * QA gate: validates the Governance Calendar source — event shape, deterministic
 * ordering, relative-time labels, day grouping, and upcoming filtering.
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", resolveJsonModule: true, esModuleInterop: true },
});

const root = path.resolve(process.cwd(), "src", "data");
const manifest = require(path.join(root, "app.manifest.json"));
const cal = require(path.join(root, "governanceCalendarSource.ts"));

let passed = 0, failed = 0;
function assert(label, condition, detail = "") {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

// Fixed anchor so the whole suite is deterministic: 2026-06-14T00:00:00Z
const ANCHOR = Date.UTC(2026, 5, 14, 0, 0, 0);
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

console.log("\nCalendar: load + shape");
const placeholderManifest = { chain: { rpcUrl: "https://YOUR_RPC_ENDPOINT" }, contracts: { governor: "" } };
const calendar = cal.loadGovernanceCalendar(placeholderManifest, ANCHOR);
assert("transport is fixture for placeholder manifest", calendar.transport === "fixture", calendar.transport);
assert("anchorMs echoes input", calendar.anchorMs === ANCHOR);
assert("has at least 8 events", calendar.events.length >= 8, `got ${calendar.events.length}`);
const KINDS = new Set(["voting-opens", "voting-closes", "timelock-ready", "drill-window", "grace-expiry"]);
assert("every event has a valid kind", calendar.events.every((e) => KINDS.has(e.kind)));
assert("every event id is unique", new Set(calendar.events.map((e) => e.id)).size === calendar.events.length);
assert("every event has title + refId", calendar.events.every((e) => e.title.length > 0 && e.refId.length > 0));
assert("every event tone is valid", calendar.events.every((e) => ["pine", "bronze", "rose"].includes(e.tone)));

console.log("\nCalendar: chronological ordering");
let ordered = true;
for (let i = 1; i < calendar.events.length; i += 1) if (calendar.events[i].etaMs < calendar.events[i - 1].etaMs) ordered = false;
assert("events are sorted ascending by etaMs", ordered);
assert("all fixture events are after the anchor", calendar.events.every((e) => e.etaMs > ANCHOR));

console.log("\nCalendar: determinism");
const again = cal.loadGovernanceCalendar(manifest, ANCHOR);
assert("same anchor → identical events", JSON.stringify(again.events) === JSON.stringify(calendar.events));

console.log("\nCalendar: relativeTimeLabel");
assert("now within a minute", cal.relativeTimeLabel(ANCHOR, ANCHOR + 30 * 1000) === "now");
assert("minutes ahead", cal.relativeTimeLabel(ANCHOR, ANCHOR + 5 * 60 * 1000) === "in 5m");
assert("hours ahead", cal.relativeTimeLabel(ANCHOR, ANCHOR + 6 * HOUR) === "in 6h");
assert("days ahead", cal.relativeTimeLabel(ANCHOR, ANCHOR + 3 * DAY) === "in 3d");
assert("hours ago", cal.relativeTimeLabel(ANCHOR, ANCHOR - 2 * HOUR) === "2h ago");
assert("just now (past)", cal.relativeTimeLabel(ANCHOR, ANCHOR - 10 * 1000) === "just now");

console.log("\nCalendar: upcoming filter");
const midpoint = ANCHOR + 2 * DAY;
const up = cal.upcomingEvents(calendar, midpoint);
assert("upcoming excludes past events", up.every((e) => e.etaMs >= midpoint));
assert("upcoming is a subset", up.length < calendar.events.length && up.length > 0, `got ${up.length}/${calendar.events.length}`);

console.log("\nCalendar: groupEventsByDay");
const groups = cal.groupEventsByDay(calendar.events);
assert("groups are non-empty", groups.length >= 1);
assert("group days are sorted", groups.every((g, i) => i === 0 || g.isoDate > groups[i - 1].isoDate));
assert("group event counts sum to total", groups.reduce((n, g) => n + g.events.length, 0) === calendar.events.length);
assert("each group has a dayLabel", groups.every((g) => /^[A-Z][a-z]{2} [A-Z][a-z]{2} \d+$/.test(g.dayLabel)));

console.log("\nCalendar: countByKind");
const counts = cal.countByKind(calendar.events);
const sum = Object.values(counts).reduce((a, b) => a + b, 0);
assert("counts sum to total events", sum === calendar.events.length, `got ${sum}`);

console.log(`\ncheck-calendar: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
