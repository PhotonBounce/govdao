import { AppManifest } from "../types";

export type PushPermissionStatus = "granted" | "denied" | "undetermined" | "unsupported";

export interface PushState {
  supported: boolean;
  status: PushPermissionStatus;
  token: string | null;
  detail: string;
}

export const UNSUPPORTED_PUSH_STATE: PushState = {
  supported: false,
  status: "unsupported",
  token: null,
  detail: "Push notifications require a native device build (not available on web).",
};

/** Push registration is only attempted when the manifest enables the feature. */
export function pushEnabled(manifest: AppManifest): boolean {
  return manifest.features?.pushNotifications === true;
}

export type PushChannelImportance = "high" | "default" | "low";

export interface PushChannel {
  id: string;
  name: string;
  importance: PushChannelImportance;
}

/** Android notification channels, derived from the enabled governance features. */
export function pushChannels(manifest: AppManifest): PushChannel[] {
  const channels: PushChannel[] = [
    { id: "governance", name: "Governance", importance: "high" },
    { id: "guardian", name: "Guardian Alerts", importance: "high" },
  ];
  if (manifest.features?.voting) channels.push({ id: "votes", name: "Voting Reminders", importance: "high" });
  if (manifest.features?.treasuryView) channels.push({ id: "treasury", name: "Treasury Activity", importance: "default" });
  return channels;
}

/** Truncate an Expo push token for display, preserving the wrapper. */
export function shortenToken(token: string | null): string {
  if (!token) return "—";
  const wrapped = token.match(/^(\w+\[)(.+)(\])$/);
  if (wrapped) {
    const inner = wrapped[2];
    const head = inner.length > 10 ? `${inner.slice(0, 6)}…${inner.slice(-4)}` : inner;
    return `${wrapped[1]}${head}${wrapped[3]}`;
  }
  return token.length > 18 ? `${token.slice(0, 10)}…${token.slice(-4)}` : token;
}

export function describePushStatus(status: PushPermissionStatus): string {
  switch (status) {
    case "granted":
      return "Enabled — this device can receive governance alerts.";
    case "denied":
      return "Disabled in system settings. Enable notifications for GOVDAO to receive alerts.";
    case "undetermined":
      return "Not yet requested. Tap Enable to allow governance alerts.";
    default:
      return "Push requires a native device build.";
  }
}
