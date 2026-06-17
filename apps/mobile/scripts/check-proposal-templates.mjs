/** QA gate: proposal template definitions + prefill. */
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
require("ts-node").register({ transpileOnly: true, skipProject: true, compilerOptions: { module: "commonjs", moduleResolution: "node", target: "es2020", esModuleInterop: true } });
const t = require(path.resolve(process.cwd(), "src", "data", "proposalTemplateSource.ts"));

let passed = 0, failed = 0;
function assert(label, cond, detail = "") { if (cond) { console.log(`  ✓ ${label}`); passed++; } else { console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`); failed++; } }

console.log("\nTemplates: catalog");
assert("at least 5 templates", t.PROPOSAL_TEMPLATES.length >= 5, String(t.PROPOSAL_TEMPLATES.length));
assert("ids unique", new Set(t.PROPOSAL_TEMPLATES.map((x) => x.id)).size === t.PROPOSAL_TEMPLATES.length);
assert("each has name, category, title, summary, glyph", t.PROPOSAL_TEMPLATES.every((x) => x.name && x.category && x.title && x.summary.length >= 20 && x.glyph));

console.log("\nTemplates: applyTemplate prefill");
const pre = t.applyTemplate(t.PROPOSAL_TEMPLATES[0]);
assert("prefill has title + summary", pre.title.length > 0 && pre.summary.length > 0);
assert("prefill title matches template", pre.title === t.PROPOSAL_TEMPLATES[0].title);
assert("prefill has empty doc fields", pre.docUri === "" && pre.docHash === "");

console.log("\nTemplates: grouping + lookup");
const grouped = t.templatesByCategory();
const catCount = Object.values(grouped).reduce((n, arr) => n + arr.length, 0);
assert("grouping covers all templates", catCount === t.PROPOSAL_TEMPLATES.length);
assert("findTemplate returns by id", t.findTemplate("treasury-spend")?.id === "treasury-spend");
assert("findTemplate null for unknown", t.findTemplate("nope") === null);

console.log(`\ncheck-proposal-templates: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
