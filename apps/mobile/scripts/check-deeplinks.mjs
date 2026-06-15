/**
 * QA gate: validates deep-link parsing — scheme stripping, view mapping,
 * proposal targets, and rejection of unknown links.
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
require("ts-node").register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", esModuleInterop: true },
});

const dataDir = path.resolve(process.cwd(), "src", "data");
const { parseDeepLink, isKnownView } = require(path.join(dataDir, "deepLinkSource.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; }
}

console.log("\nDeepLinks: scheme + bare view");
assert("govdao://treasury → treasury", parseDeepLink("govdao://treasury")?.view === "treasury");
assert("govdao://view/calendar → calendar", parseDeepLink("govdao://view/calendar")?.view === "calendar");
assert("govdao://app/analytics → analytics", parseDeepLink("govdao://app/analytics")?.view === "analytics");
assert("hyphenated view deploy-wizard", parseDeepLink("govdao://deploy-wizard")?.view === "deploy-wizard");

console.log("\nDeepLinks: universal (https) links");
assert("https photon-bounce app/search → search", parseDeepLink("https://photon-bounce.com/app/search")?.view === "search");
assert("query string is ignored", parseDeepLink("https://photon-bounce.com/app/activity?ref=email")?.view === "activity");

console.log("\nDeepLinks: proposal targets");
const p = parseDeepLink("govdao://proposal/GOV-12");
assert("proposal link → proposals view", p?.view === "proposals");
assert("proposal link carries id", p?.proposalId === "GOV-12", p?.proposalId);

console.log("\nDeepLinks: rejection");
assert("unknown view → null", parseDeepLink("govdao://nope") === null);
assert("empty string → null", parseDeepLink("") === null);
assert("non-string → null", parseDeepLink(undefined) === null);

console.log("\nDeepLinks: isKnownView");
assert("treasury is known", isKnownView("treasury") === true);
assert("bogus is not known", isKnownView("bogus") === false);

console.log(`\ncheck-deeplinks: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
