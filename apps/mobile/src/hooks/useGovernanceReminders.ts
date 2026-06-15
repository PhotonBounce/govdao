import { AppManifest } from "../types";
import { GovernanceCalendar } from "../data/governanceCalendarSource";

export interface ReminderController {
  scheduledCount: number;
  supported: boolean;
  detail: string;
  schedule: () => void;
}

// Web / default: scheduling local notifications is a no-op. The expo-notifications
// SDK is only imported by useGovernanceReminders.native.ts.
export function useGovernanceReminders(_manifest: AppManifest, _calendar: GovernanceCalendar): ReminderController {
  return {
    scheduledCount: 0,
    supported: false,
    detail: "Reminders require a native device build.",
    schedule: () => {},
  };
}
