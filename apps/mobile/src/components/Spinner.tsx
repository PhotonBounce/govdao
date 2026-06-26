import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { darkPalette } from "../theme";

interface SpinnerProps {
  label?: string;
  size?: number;
  tone?: "light" | "dark";
}

/**
 * Lightweight continuous spinner — a rotating arc rendered with a border trick,
 * no images or native deps. Gives live on-chain reads a sense of motion so a
 * slow RPC round-trip reads as "working", not "stuck".
 */
export function Spinner({ label, size = 16, tone = "dark" }: SpinnerProps) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const color = tone === "dark" ? darkPalette.softGold : "#8e5c32";

  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel={label ?? "Loading"}>
      <Animated.View
        style={[
          styles.arc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            borderTopColor: "transparent",
            transform: [{ rotate }],
          },
        ]}
      />
      {label ? <Text style={[styles.label, tone === "light" && styles.labelLight]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  arc: {
    borderWidth: 2
  },
  label: {
    color: "rgba(224,219,208,0.72)",
    fontSize: 13,
    lineHeight: 18
  },
  labelLight: {
    color: "#5d5148"
  }
});
