/**
 * Headless QA for notification preferences.
 * Exercises manifest-derived category gating, default preference derivation,
 * the save flow phases, validation failures, and endpoint resolution.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// --- inline notification source (mirrors notificationSource.ts) ---

const DIGEST_FREQUENCIES = ["realtime", "daily", "weekly"];

function isPlaceholder(value) {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("example.") || normalized.includes("your_");
}

function getNotificationCategories(manifest) {
  const categories = [];

  if (manifest.features.proposalFeed) {
    categories.push({ id: "proposal-voting", defaultEnabled: true });
    categories.push({ id: "proposal-queued", defaultEnabled: true });
  }

  if (manifest.governance.offchain.enabled) {
    categories.push({ id: "motion-review", defaultEnabled: true });
  }

  if (manifest.features.treasuryView) {
    categories.push({ id: "treasury-movement", defaultEnabled: false });
  }

  categories.push({ id: "guardian-event", defaultEnabled: true });

  return categories;
}

function getDefaultPreferences(manifest) {
  const enabled = {};
  for (const category of getNotificationCategories(manifest)) {
    enabled[category.id] = category.defaultEnabled;
  }
  return { enabled, frequency: "realtime" };
}

function countEnabled(preferences) {
  return Object.values(preferences.enabled).filter(Boolean).length;
}

async function saveNotificationPreferences(manifest, preferences, onPhase) {
  onPhase?.("validating");

  const knownIds = new Set(getNotificationCategories(manifest).map((category) => category.id));
  const unknownIds = Object.keys(preferences.enabled).filter((id) => !knownIds.has(id));

  if (unknownIds.length > 0) {
    throw new Error(`Unknown notification categories: ${unknownIds.join(", ")}`);
  }

  if (!DIGEST_FREQUENCIES.includes(preferences.frequency)) {
    throw new Error(`Unknown digest frequency: ${preferences.frequency}`);
  }

  await new Promise((r) => setTimeout(r, 10));
  onPhase?.("saving");
  await new Promise((r) => setTimeout(r, 10));

  const baseUrl = manifest.services.notificationBaseUrl?.trim() ?? "";
  const liveEndpoint = baseUrl.startsWith("https://") && !isPlaceholder(baseUrl);

  return {
    savedAt: new Date().toISOString(),
    transport: "fixture",
    endpoint: liveEndpoint ? `${baseUrl.replace(/\/$/, "")}/preferences` : null,
    enabledCount: countEnabled(preferences),
    frequency: preferences.frequency
  };
}

// --- load the real local manifest so gating is checked against actual config ---

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(scriptDir, "..", "src", "data", "app.manifest.json");
const localManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

let passed = 0;
let failed = 0;

function pass(label) {
  console.log(`  ✓ ${label}`);
  passed++;
}

function fail(label, err) {
  console.error(`  ✗ ${label}: ${err?.message ?? err}`);
  failed++;
}

// --- category gating tests ---
console.log("\nCategories: local manifest derives the full category set");
{
  try {
    const categories = getNotificationCategories(localManifest);
    const ids = categories.map((c) => c.id);
    assert.deepEqual(
      ids,
      ["proposal-voting", "proposal-queued", "motion-review", "treasury-movement", "guardian-event"],
      "local manifest (all features on) should yield all 5 categories"
    );
    pass(`local manifest yields ${ids.length} categories`);
  } catch (err) {
    fail("local manifest categories", err);
  }
}

console.log("\nCategories: disabled features drop their categories");
{
  try {
    const stripped = {
      ...localManifest,
      features: { ...localManifest.features, proposalFeed: false, treasuryView: false },
      governance: { ...localManifest.governance, offchain: { ...localManifest.governance.offchain, enabled: false } }
    };
    const ids = getNotificationCategories(stripped).map((c) => c.id);
    assert.deepEqual(ids, ["guardian-event"], "only guardian alerts should remain");
    pass("feature-disabled manifest yields guardian-event only");
  } catch (err) {
    fail("category gating", err);
  }
}

console.log("\nDefaults: treasury alerts default off, everything else on");
{
  try {
    const prefs = getDefaultPreferences(localManifest);
    assert.equal(prefs.enabled["treasury-movement"], false, "treasury alerts should default off");
    assert.equal(prefs.enabled["proposal-voting"], true);
    assert.equal(prefs.enabled["guardian-event"], true);
    assert.equal(prefs.frequency, "realtime");
    assert.equal(countEnabled(prefs), 4, "4 of 5 categories on by default");
    pass("default preferences derived correctly");
  } catch (err) {
    fail("default preferences", err);
  }
}

// --- save flow tests ---
console.log("\nSave: phases through validating→saving and reports enabled count");
{
  const phases = [];
  try {
    const prefs = getDefaultPreferences(localManifest);
    const result = await saveNotificationPreferences(localManifest, prefs, (p) => phases.push(p));
    assert.deepEqual(phases, ["validating", "saving"]);
    assert.equal(result.transport, "fixture");
    assert.equal(result.enabledCount, 4);
    assert.equal(result.frequency, "realtime");
    pass("save flow completed with fixture transport");
  } catch (err) {
    fail("save flow", err);
  }
}

console.log("\nSave: placeholder notification service yields null endpoint");
{
  try {
    const prefs = getDefaultPreferences(localManifest);
    const result = await saveNotificationPreferences(localManifest, prefs, () => {});
    assert.equal(result.endpoint, null, "example.govdao.app should be treated as placeholder");
    pass("placeholder service yields null endpoint");
  } catch (err) {
    fail("placeholder endpoint", err);
  }
}

console.log("\nSave: configured notification service resolves /preferences endpoint");
{
  try {
    const liveManifest = {
      ...localManifest,
      services: { ...localManifest.services, notificationBaseUrl: "https://notify.govdao.app/" }
    };
    const prefs = getDefaultPreferences(liveManifest);
    const result = await saveNotificationPreferences(liveManifest, prefs, () => {});
    assert.equal(result.endpoint, "https://notify.govdao.app/preferences", "trailing slash should normalize");
    pass("live service endpoint resolved");
  } catch (err) {
    fail("live endpoint", err);
  }
}

console.log("\nSave: unknown category id is rejected");
{
  try {
    const prefs = getDefaultPreferences(localManifest);
    prefs.enabled["bogus-category"] = true;
    await saveNotificationPreferences(localManifest, prefs, () => {});
    fail("unknown category", new Error("did not throw"));
  } catch (err) {
    try {
      assert.ok(err.message.includes("bogus-category"), "error should name the unknown category");
      pass("unknown category rejected");
    } catch (assertErr) {
      fail("unknown category error", assertErr);
    }
  }
}

console.log("\nSave: unknown frequency is rejected");
{
  try {
    const prefs = { ...getDefaultPreferences(localManifest), frequency: "hourly" };
    await saveNotificationPreferences(localManifest, prefs, () => {});
    fail("unknown frequency", new Error("did not throw"));
  } catch (err) {
    try {
      assert.ok(err.message.includes("hourly"), "error should name the bad frequency");
      pass("unknown frequency rejected");
    } catch (assertErr) {
      fail("unknown frequency error", assertErr);
    }
  }
}

console.log("\nSave: stale categories from a previous manifest are rejected");
{
  try {
    const prefs = getDefaultPreferences(localManifest);
    const stripped = {
      ...localManifest,
      features: { ...localManifest.features, treasuryView: false }
    };
    await saveNotificationPreferences(stripped, prefs, () => {});
    fail("stale category", new Error("did not throw"));
  } catch (err) {
    try {
      assert.ok(err.message.includes("treasury-movement"), "treasury category should be unknown when treasuryView is off");
      pass("stale categories rejected after feature downgrade");
    } catch (assertErr) {
      fail("stale category error", assertErr);
    }
  }
}

// --- summary ---
console.log(`\ncheck-notifications: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
