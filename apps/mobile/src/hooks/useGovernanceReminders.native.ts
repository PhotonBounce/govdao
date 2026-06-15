import { useCallback, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { AppManifest } from "../types";
import { GovernanceCalendar } from "../data/governanceCalendarSource";
import { pushEnabled } from "../data/pushConfig";
import { buildReminders, secondsUntilTrigger } from "../data/reminderSource";

export interface ReminderController {
  scheduledCount: number;
  supported: boolean;
  detail: string;
  schedule: () => void;
}

const REMINDER_TAG = "govdao-reminder";

export function useGovernanceReminders(manifest: AppManifest, calendar: GovernanceCalendar): ReminderController {
  const supported = pushEnabled(manifest) && Platform.OS !== "web";
  const [scheduledCount, setScheduledCount] = useState(0);
  const [detail, setDetail] = useState(
    supported ? "Schedule local reminders for upcoming voting and timelock deadlines." : "Reminders require a native device build."
  );

  const schedule = useCallback(async () => {
    if (!supported) {
      setDetail("Reminders require a native device build.");
      return;
    }
    try {
      const permission = await Notifications.getPermissionsAsync();
      let status = permission.status;
      if (status !== "granted") {
        status = (await Notifications.requestPermissionsAsync()).status;
      }
      if (status !== "granted") {
        setDetail("Notification permission is required to schedule reminders.");
        return;
      }

      // Clear any reminders we scheduled before, then re-schedule from the calendar.
      const existing = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(
        existing
          .filter((n) => (n.content.data as { tag?: string } | undefined)?.tag === REMINDER_TAG)
          .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
      );

      const now = Date.now();
      const reminders = buildReminders(calendar, now);
      let count = 0;
      for (const reminder of reminders) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body: reminder.body,
            data: { tag: REMINDER_TAG, eventId: reminder.eventId },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntilTrigger(reminder, now),
            channelId: reminder.channelId,
          },
        });
        count += 1;
      }
      setScheduledCount(count);
      setDetail(count > 0 ? `${count} reminder${count === 1 ? "" : "s"} scheduled.` : "No upcoming events to remind about.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "scheduling failed";
      setDetail(`Could not schedule reminders: ${message}.`);
    }
  }, [supported, calendar]);

  return { scheduledCount, supported, detail, schedule };
}
