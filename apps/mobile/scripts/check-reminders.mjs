/**
 * QA gate: validates the governance reminder builder — future-only triggers, lead
 * times, channels, ordering, and the seconds-until-trigger conversion. The native
 * scheduling is platform-split (useGovernanceReminders.native.ts).
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", resolveJsonModule: true, esModuleInterop: true },
});

const dataDir = path.resolve(process.cwd(), "src", "data");
const manifest = require(path.join(dataDir, "app.manifest.json"));
const cal = require(path.join(dataDir, "governanceCalendarSource.ts"));
const rem = require(path.join(dataDir, "reminderSource.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

const ANCHOR = Date.UTC(2026, 5, 15, 0, 0, 0);
const calendar = cal.loadGovernanceCalendar(manifest, ANCHOR);

console.log("\nReminders: leads + shape");
assert("two lead times (24h, 1h)", rem.REMINDER_LEADS_MS.length === 2 && rem.REMINDER_LEADS_MS.includes(24 * 3600 * 1000) && rem.REMINDER_LEADS_MS.includes(3600 * 1000));

const reminders = rem.buildReminders(calendar, ANCHOR);
assert("produces at least one reminder", reminders.length >= 1, String(reminders.length));
assert("no more than 2 per event", reminders.length <= calendar.events.length * 2);
assert("every trigger is in the future", reminders.every((r) => r.triggerMs > ANCHOR));
assert("ids are unique", new Set(reminders.map((r) => r.id)).size === reminders.length);
assert("each has title + body", reminders.every((r) => r.title.length > 0 && r.body.includes("(")));
assert("each maps to a known channel", reminders.every((r) => ["governance", "votes", "guardian"].includes(r.channelId)));
assert("each lead is one of the configured leads", reminders.every((r) => rem.REMINDER_LEADS_MS.includes(r.leadMs)));

console.log("\nReminders: ordering");
let sorted = true;
for (let i = 1; i < reminders.length; i += 1) if (reminders[i].triggerMs < reminders[i - 1].triggerMs) sorted = false;
assert("reminders sorted by trigger time", sorted);

console.log("\nReminders: titles reflect lead time");
assert("a 24h reminder says 'in 24 hours'", reminders.some((r) => r.leadMs === 24 * 3600 * 1000 && /in 24 hours/.test(r.title)));
assert("a 1h reminder says 'in 1 hour'", reminders.some((r) => r.leadMs === 3600 * 1000 && /in 1 hour/.test(r.title)));

console.log("\nReminders: secondsUntilTrigger + count helper");
assert("secondsUntilTrigger is positive", reminders.every((r) => rem.secondsUntilTrigger(r, ANCHOR) >= 1));
assert("countUpcomingReminders matches builder", rem.countUpcomingReminders(calendar, ANCHOR) === reminders.length);

console.log("\nReminders: past anchor yields nothing in the past");
const farFuture = ANCHOR + 100 * 24 * 3600 * 1000;
assert("no reminders when all events are in the past", rem.buildReminders(calendar, farFuture).length === 0);

console.log(`\ncheck-reminders: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
