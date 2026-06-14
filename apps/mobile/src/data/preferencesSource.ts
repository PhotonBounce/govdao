// App Preferences — user-controllable UX toggles. Pure model with no React/RN
// imports so the rules are unit-testable. State is held by PreferencesContext.

export interface AppPreferences {
  soundEnabled: boolean;
  reduceMotion: boolean;
  hapticsEnabled: boolean;
  compactNav: boolean;
}

export type PreferenceKey = keyof AppPreferences;

export const DEFAULT_PREFERENCES: AppPreferences = {
  soundEnabled: true,
  reduceMotion: false,
  hapticsEnabled: true,
  compactNav: false,
};

export const PREFERENCE_META: Record<PreferenceKey, { label: string; description: string }> = {
  soundEnabled: {
    label: "Sound effects",
    description: "Play tap, vote and receipt cues when you interact.",
  },
  reduceMotion: {
    label: "Reduce motion",
    description: "Turn off the animated code-rain background and color cycling for a calmer, lower-power screen.",
  },
  hapticsEnabled: {
    label: "Haptics",
    description: "Vibrate briefly on key actions (where the device supports it).",
  },
  compactNav: {
    label: "Compact navigation",
    description: "Tighten the tab bar spacing to fit more tabs without scrolling.",
  },
};

export const PREFERENCE_ORDER: PreferenceKey[] = ["soundEnabled", "reduceMotion", "hapticsEnabled", "compactNav"];

export function isPreferenceKey(key: string): key is PreferenceKey {
  return key in DEFAULT_PREFERENCES;
}

export function togglePreference(prefs: AppPreferences, key: PreferenceKey): AppPreferences {
  return { ...prefs, [key]: !prefs[key] };
}

export function setPreference(prefs: AppPreferences, key: PreferenceKey, value: boolean): AppPreferences {
  return { ...prefs, [key]: value };
}

/** Merge a partial/untrusted stored object onto the defaults, dropping unknown keys. */
export function normalizePreferences(input: unknown): AppPreferences {
  const out: AppPreferences = { ...DEFAULT_PREFERENCES };
  if (input && typeof input === "object") {
    for (const key of PREFERENCE_ORDER) {
      const v = (input as Record<string, unknown>)[key];
      if (typeof v === "boolean") out[key] = v;
    }
  }
  return out;
}

/** Count of enabled preferences — used for a settings summary line. */
export function countEnabled(prefs: AppPreferences): number {
  return PREFERENCE_ORDER.reduce((n, k) => n + (prefs[k] ? 1 : 0), 0);
}

export function summarizePreferences(prefs: AppPreferences): string {
  const parts: string[] = [];
  parts.push(prefs.soundEnabled ? "sound on" : "sound off");
  parts.push(prefs.reduceMotion ? "motion reduced" : "full motion");
  parts.push(prefs.hapticsEnabled ? "haptics on" : "haptics off");
  return parts.join(" · ");
}
