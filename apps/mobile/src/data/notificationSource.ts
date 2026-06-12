import { AppManifest } from "../types";

export type DigestFrequency = "realtime" | "daily" | "weekly";
export type PreferenceSavePhase = "validating" | "saving";

export interface NotificationCategory {
  id: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

export interface NotificationPreferences {
  enabled: Record<string, boolean>;
  frequency: DigestFrequency;
}

export interface PreferenceSaveResult {
  savedAt: string;
  transport: "fixture" | "remote";
  endpoint: string | null;
  enabledCount: number;
  frequency: DigestFrequency;
}

export const DIGEST_FREQUENCIES: DigestFrequency[] = ["realtime", "daily", "weekly"];

const VALIDATE_DELAY_MS = 200;
const SAVE_DELAY_MS = 500;

function isPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("example.") || normalized.includes("your_");
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

// Categories are manifest-derived: a deployment that disables a surface
// must not offer alerts for it.
export function getNotificationCategories(manifest: AppManifest): NotificationCategory[] {
  const categories: NotificationCategory[] = [];

  if (manifest.features.proposalFeed) {
    categories.push({
      id: "proposal-voting",
      label: "Proposals entering voting",
      description: "Alert when a proposal opens its voting window.",
      defaultEnabled: true
    });
    categories.push({
      id: "proposal-queued",
      label: "Queued executions",
      description: "Alert when a passed proposal is queued behind the timelock.",
      defaultEnabled: true
    });
  }

  if (manifest.governance.offchain.enabled) {
    categories.push({
      id: "motion-review",
      label: "Motions awaiting review",
      description: "Alert when an off-chain motion reaches your review stage.",
      defaultEnabled: true
    });
  }

  if (manifest.features.treasuryView) {
    categories.push({
      id: "treasury-movement",
      label: "Treasury movements",
      description: "Alert on new inflows, outflows, and queued transfers.",
      defaultEnabled: false
    });
  }

  categories.push({
    id: "guardian-event",
    label: "Guardian emergencies",
    description: "Alert on pauses, drills, and signer-set changes. Recommended for all members.",
    defaultEnabled: true
  });

  return categories;
}

export function getDefaultPreferences(manifest: AppManifest): NotificationPreferences {
  const enabled: Record<string, boolean> = {};

  for (const category of getNotificationCategories(manifest)) {
    enabled[category.id] = category.defaultEnabled;
  }

  return { enabled, frequency: "realtime" };
}

export function countEnabled(preferences: NotificationPreferences): number {
  return Object.values(preferences.enabled).filter(Boolean).length;
}

export async function saveNotificationPreferences(
  manifest: AppManifest,
  preferences: NotificationPreferences,
  onPhase?: (phase: PreferenceSavePhase) => void
): Promise<PreferenceSaveResult> {
  onPhase?.("validating");

  const knownIds = new Set(getNotificationCategories(manifest).map((category) => category.id));
  const unknownIds = Object.keys(preferences.enabled).filter((id) => !knownIds.has(id));

  if (unknownIds.length > 0) {
    throw new Error(`Unknown notification categories: ${unknownIds.join(", ")}`);
  }

  if (!DIGEST_FREQUENCIES.includes(preferences.frequency)) {
    throw new Error(`Unknown digest frequency: ${preferences.frequency}`);
  }

  await wait(VALIDATE_DELAY_MS);
  onPhase?.("saving");
  await wait(SAVE_DELAY_MS);

  // Until the hosted notification service is promoted, saves settle against a
  // fixture path that mirrors the request the live endpoint would receive.
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

export function formatFrequency(frequency: DigestFrequency): string {
  if (frequency === "realtime") {
    return "Real-time";
  }

  return frequency.charAt(0).toUpperCase() + frequency.slice(1) + " digest";
}
