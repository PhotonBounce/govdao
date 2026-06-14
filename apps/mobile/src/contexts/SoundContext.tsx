import { createContext, ReactNode, useContext } from "react";
import { useSoundEffects, SoundName } from "../hooks/useSoundEffects";

interface SoundContextValue {
  play: (name: SoundName) => void;
}

const SoundContext = createContext<SoundContextValue>({ play: () => {} });

export function SoundProvider({ children }: { children: ReactNode }) {
  const { play } = useSoundEffects();
  return (
    <SoundContext.Provider value={{ play }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}
