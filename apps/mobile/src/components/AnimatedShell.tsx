import { ReactNode, useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { CodeRainBackground } from "./CodeRainBackground";
import { BG_CYCLE } from "../utils/animations";
import { usePreferences } from "../contexts/PreferencesContext";

const CYCLE = [...BG_CYCLE];

const STEP_MS = 2500;

interface AnimatedShellProps {
  children: ReactNode;
}

export function AnimatedShell({ children }: AnimatedShellProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const { prefs } = usePreferences();
  const reduceMotion = prefs.reduceMotion;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence(
        CYCLE.slice(0, -1).map((_, i) =>
          Animated.timing(anim, {
            toValue: i + 1,
            duration: STEP_MS,
            useNativeDriver: false,
          })
        )
      )
    );
    loop.start();
    return () => loop.stop();
  }, [anim, reduceMotion]);

  const backgroundColor = anim.interpolate({
    inputRange: CYCLE.map((_, i) => i),
    outputRange: CYCLE,
  });

  // Keep a single element tree in both modes so toggling reduce-motion doesn't
  // remount children (which would reset scroll positions and local state).
  return (
    <Animated.View style={[styles.shell, { backgroundColor: reduceMotion ? CYCLE[0] : backgroundColor }]}>
      {reduceMotion ? null : <CodeRainBackground seed={1337} columns={12} />}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    overflow: "hidden",
  },
});
