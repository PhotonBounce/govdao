/**
 * QA gate: validates the quick-jump search index and ranking logic.
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", esModuleInterop: true },
});

const root = path.resolve(process.cwd(), "src", "data");
const { SEARCH_DESTINATIONS, searchDestinations, topDestination } = require(path.join(root, "searchSource.ts"));

let passed = 0, failed = 0;
function assert(label, condition, detail = "") {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

console.log("\nSearch: index shape");
assert("at least 13 destinations", SEARCH_DESTINATIONS.length >= 13, `got ${SEARCH_DESTINATIONS.length}`);
assert("every destination has view + label", SEARCH_DESTINATIONS.every((d) => d.view && d.label.length > 0));
assert("every destination has a description", SEARCH_DESTINATIONS.every((d) => d.description.length >= 5));
assert("every destination has keywords", SEARCH_DESTINATIONS.every((d) => Array.isArray(d.keywords) && d.keywords.length >= 1));
assert("views are unique", new Set(SEARCH_DESTINATIONS.map((d) => d.view)).size === SEARCH_DESTINATIONS.length);

console.log("\nSearch: empty query");
const all = searchDestinations("");
assert("empty query returns all", all.length === SEARCH_DESTINATIONS.length);

console.log("\nSearch: ranking");
const vote = searchDestinations("vote");
assert("'vote' returns matches", vote.length >= 1);
assert("'vote' top is Proposals (keyword)", vote[0].view === "proposals", `got ${vote[0]?.view}`);

const settings = searchDestinations("set");
assert("'set' top label starts with Set (Settings)", settings[0].label.toLowerCase().startsWith("set"), `got ${settings[0]?.label}`);

const cal = searchDestinations("cal");
assert("'cal' top is Calendar (prefix)", cal[0].view === "calendar", `got ${cal[0]?.view}`);

const stats = searchDestinations("stats");
assert("'stats' resolves to Analytics (keyword)", stats[0].view === "analytics", `got ${stats[0]?.view}`);

console.log("\nSearch: scoring order");
const treasury = searchDestinations("trea");
assert("prefix match scores 4", treasury[0].score === 4, `got ${treasury[0]?.score}`);
const funds = searchDestinations("funds");
assert("keyword-only match scores 1", funds.every((r) => r.view !== "treasury" || r.score === 1));
assert("results sorted by score desc", searchDestinations("e").every((r, i, arr) => i === 0 || arr[i - 1].score >= r.score));

console.log("\nSearch: no match");
const none = searchDestinations("zzzqqq");
assert("nonsense query returns nothing", none.length === 0);
assert("topDestination null on no match", topDestination("zzzqqq") === null);
assert("topDestination returns best on match", topDestination("calendar")?.view === "calendar");

console.log(`\ncheck-search: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
