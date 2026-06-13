import { ReactNode, useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

const CYCLE = [
  "#0d0d1a",
  "#0a1a14",
  "#1a0d0d",
  "#0d1214",
  "#0d0d1a",
];

const STEP_MS = 2500;

interface AnimatedShellProps {
  children: ReactNode;
}

export function AnimatedShell({ children }: AnimatedShellProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [anim]);

  const backgroundColor = anim.interpolate({
    inputRange: CYCLE.map((_, i) => i),
    outputRange: CYCLE,
  });

  return (
    <Animated.View style={[styles.shell, { backgroundColor }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
});
