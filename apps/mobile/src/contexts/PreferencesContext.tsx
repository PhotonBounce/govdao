import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import {
  AppPreferences,
  DEFAULT_PREFERENCES,
  PreferenceKey,
  togglePreference,
} from "../data/preferencesSource";

interface PreferencesContextValue {
  prefs: AppPreferences;
  toggle: (key: PreferenceKey) => void;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  prefs: DEFAULT_PREFERENCES,
  toggle: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFERENCES);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      prefs,
      toggle: (key: PreferenceKey) => setPrefs((current) => togglePreference(current, key)),
    }),
    [prefs]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
