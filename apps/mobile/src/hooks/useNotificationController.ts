import { useMemo, useRef, useState } from "react";
import { AppManifest } from "../types";
import {
  DigestFrequency,
  getDefaultPreferences,
  getNotificationCategories,
  NotificationPreferences,
  PreferenceSaveResult,
  saveNotificationPreferences
} from "../data/notificationSource";

export type PreferenceSaveStatus = "idle" | "validating" | "saving" | "saved" | "failed";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Saving notification preferences failed unexpectedly.";
}

export function useNotificationController(manifest: AppManifest) {
  const categories = useMemo(() => getNotificationCategories(manifest), [manifest]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => getDefaultPreferences(manifest));
  const [saveStatus, setSaveStatus] = useState<PreferenceSaveStatus>("idle");
  const [saveResult, setSaveResult] = useState<PreferenceSaveResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  function toggleCategory(categoryId: string) {
    setPreferences((current) => ({
      ...current,
      enabled: { ...current.enabled, [categoryId]: !current.enabled[categoryId] }
    }));
    setSaveStatus("idle");
    setSaveResult(null);
  }

  function setFrequency(frequency: DigestFrequency) {
    setPreferences((current) => ({ ...current, frequency }));
    setSaveStatus("idle");
    setSaveResult(null);
  }

  async function savePreferences() {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setSaveError(null);
    setSaveStatus("validating");

    try {
      const result = await saveNotificationPreferences(manifest, preferences, (phase) => {
        if (requestIdRef.current === requestId && phase === "saving") {
          setSaveStatus("saving");
        }
      });

      if (requestIdRef.current === requestId) {
        setSaveResult(result);
        setSaveStatus("saved");
      }
    } catch (error: unknown) {
      if (requestIdRef.current === requestId) {
        setSaveError(getErrorMessage(error));
        setSaveStatus("failed");
      }
    }
  }

  return {
    categories,
    preferences,
    saveStatus,
    saveResult,
    saveError,
    toggleCategory,
    setFrequency,
    savePreferences
  };
}
