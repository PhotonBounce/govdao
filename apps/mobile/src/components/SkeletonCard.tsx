import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { palette, radii } from "../theme";

interface SkeletonLineProps {
  width?: string | number;
  height?: number;
  shimmer: Animated.Value;
}

function SkeletonLine({ width = "100%", height = 14, shimmer }: SkeletonLineProps) {
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });
  return (
    <Animated.View
      style={[styles.line, { width: width as any, height, opacity }]}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
  hasTitle?: boolean;
  hasEyebrow?: boolean;
}

/**
 * Animated shimmer placeholder used while data is loading.
 * Mirrors the visual footprint of a SectionCard so the layout
 * doesn't jump when real content arrives.
 */
export function SkeletonCard({ lines = 3, hasTitle = true, hasEyebrow = true }: SkeletonCardProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  return (
    <View style={styles.card}>
      {hasEyebrow && <SkeletonLine width="35%" height={10} shimmer={shimmer} />}
      {hasTitle && <SkeletonLine width="65%" height={20} shimmer={shimmer} />}
      <View style={styles.gap} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? "70%" : "100%"} shimmer={shimmer} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.paper,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: 20,
    marginBottom: 16,
    gap: 10
  },
  line: {
    backgroundColor: palette.line,
    borderRadius: 6
  },
  gap: {
    height: 4
  }
});
