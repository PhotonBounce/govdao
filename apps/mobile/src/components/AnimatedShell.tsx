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

  // Reduce-motion: render a static obsidian backdrop with no rain or color cycle.
  if (reduceMotion) {
    return <Animated.View style={[styles.shell, { backgroundColor: CYCLE[0] }]}>{children}</Animated.View>;
  }

  return (
    <Animated.View style={[styles.shell, { backgroundColor }]}>
      <CodeRainBackground seed={1337} columns={12} />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
});
