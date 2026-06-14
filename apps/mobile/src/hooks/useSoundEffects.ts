import { Audio } from "expo-av";
import { useEffect, useRef } from "react";

export type SoundName = "tap" | "success" | "error" | "vote" | "receipt" | "scroll-snap";

const SOUND_SOURCES: Record<SoundName, ReturnType<typeof require>> = {
  tap: require("../../assets/sounds/tap.wav"),
  success: require("../../assets/sounds/success.wav"),
  error: require("../../assets/sounds/error.wav"),
  vote: require("../../assets/sounds/vote.wav"),
  receipt: require("../../assets/sounds/receipt.wav"),
  "scroll-snap": require("../../assets/sounds/scroll-snap.wav"),
};

export function useSoundEffects() {
  const sounds = useRef<Partial<Record<SoundName, Audio.Sound>>>({});
  const loaded = useRef(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const names = Object.keys(SOUND_SOURCES) as SoundName[];
        for (const name of names) {
          try {
            const { sound } = await Audio.Sound.createAsync(SOUND_SOURCES[name], { shouldPlay: false, volume: 0.8 });
            if (mounted) sounds.current[name] = sound;
          } catch {
            // individual sound load failure is non-fatal
          }
        }
        if (mounted) loaded.current = true;
      } catch {
        // audio init failure is non-fatal
      }
    }
    load();
    return () => {
      mounted = false;
      Object.values(sounds.current).forEach((s) => s?.unloadAsync().catch(() => {}));
    };
  }, []);

  function play(name: SoundName) {
    const sound = sounds.current[name];
    if (!sound) return;
    sound.setPositionAsync(0).catch(() => {});
    sound.playAsync().catch(() => {});
  }

  return { play };
}
