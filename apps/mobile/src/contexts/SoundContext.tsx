import { createContext, ReactNode, useContext } from "react";
import { useSoundEffects, SoundName } from "../hooks/useSoundEffects";
import { usePreferences } from "./PreferencesContext";

interface SoundContextValue {
  play: (name: SoundName) => void;
}

const SoundContext = createContext<SoundContextValue>({ play: () => {} });

export function SoundProvider({ children }: { children: ReactNode }) {
  const { play } = useSoundEffects();
  const { prefs } = usePreferences();

  // Respect the user's sound-effects preference: when off, playback is a no-op.
  const gatedPlay = (name: SoundName) => {
    if (!prefs.soundEnabled) return;
    play(name);
  };

  return (
    <SoundContext.Provider value={{ play: gatedPlay }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}
