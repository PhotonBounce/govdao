import { ReactNode, useRef } from "react";
import { Animated, Pressable, StyleProp, ViewStyle } from "react-native";
import { useSound } from "../contexts/SoundContext";
import { SoundName } from "../hooks/useSoundEffects";
import { pressSpringConfig, PressIntensity } from "../utils/animations";

interface AnimatedPressableProps {
  onPress: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: PressIntensity;
  sound?: SoundName | null;
  disabled?: boolean;
  /** Spoken label for screen readers (TalkBack/VoiceOver). */
  accessibilityLabel?: string;
  /** Override the default "button" role (e.g. "link", "tab"). */
  accessibilityRole?: "button" | "link" | "tab" | "none";
}

/**
 * Pressable that springs down on press-in, back up on release, and plays a
 * sound cue. Wraps any content; the scale transform is applied to an Animated.View.
 */
export function AnimatedPressable({
  onPress,
  children,
  style,
  intensity = "normal",
  sound = "tap",
  disabled = false,
  accessibilityLabel,
  accessibilityRole = "button",
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const config = pressSpringConfig(intensity);
  const { play } = useSound();

  function springTo(toScale: number, toGlow: number) {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: toScale,
        tension: config.tension,
        friction: config.friction,
        useNativeDriver: true,
      }),
      Animated.timing(glow, { toValue: toGlow, duration: 140, useNativeDriver: true }),
    ]).start();
  }

  return (
    <Pressable
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      onPressIn={() => springTo(config.pressedScale, 1)}
      onPressOut={() => springTo(config.restScale, 0)}
      onPress={() => {
        if (disabled) return;
        if (sound) play(sound);
        onPress();
      }}
    >
      <Animated.View
        style={[
          style,
          {
            opacity: disabled ? 0.5 : glow.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] }),
            transform: [{ scale }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
