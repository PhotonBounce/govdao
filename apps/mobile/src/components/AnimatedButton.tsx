import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "./AnimatedPressable";
import { SoundName } from "../hooks/useSoundEffects";
import { darkPalette, radii } from "../theme";

interface AnimatedButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
  sound?: SoundName | null;
  disabled?: boolean;
  pulse?: boolean;
}

/** Primary CTA with a soft animated sheen that sweeps across when `pulse` is set. */
export function AnimatedButton({
  label,
  onPress,
  variant = "primary",
  sound = "tap",
  disabled = false,
  pulse = false,
}: AnimatedButtonProps) {
  const sheen = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sheen, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(sheen, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, sheen]);

  const translateX = sheen.interpolate({ inputRange: [0, 1], outputRange: [-180, 220] });

  return (
    <AnimatedPressable
      onPress={onPress}
      sound={sound}
      disabled={disabled}
      accessibilityLabel={label}
      intensity="strong"
      style={[styles.base, variant === "primary" ? styles.primary : styles.ghost]}
    >
      <View style={styles.inner}>
        <Text style={[styles.label, variant === "primary" ? styles.labelPrimary : styles.labelGhost]}>{label}</Text>
        {pulse ? (
          <Animated.View pointerEvents="none" style={[styles.sheen, { transform: [{ translateX }, { rotate: "18deg" }] }]} />
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.card,
    paddingVertical: 14,
    paddingHorizontal: 22,
    overflow: "hidden",
    borderWidth: 1,
  },
  primary: {
    backgroundColor: darkPalette.glowBronze,
    borderColor: darkPalette.softGold,
  },
  ghost: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: darkPalette.glassBorder,
  },
  inner: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  labelPrimary: {
    color: "#0d0d1a",
  },
  labelGhost: {
    color: darkPalette.softGold,
  },
  sheen: {
    position: "absolute",
    top: -40,
    width: 60,
    height: 120,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
});
