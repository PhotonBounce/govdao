import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { buildRainColumns } from "../data/codeRainSource";
import { darkPalette } from "../theme";

interface CodeRainBackgroundProps {
  seed?: number;
  columns?: number;
}

/**
 * Ambient falling-code background. Each column is a vertical glyph stream that
 * translates downward on a loop, desynced by per-column duration/delay. Sits
 * behind content at low opacity so it reads as texture, not noise.
 */
export function CodeRainBackground({ seed = 1337, columns = 12 }: CodeRainBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const cols = useMemo(() => buildRainColumns({ columns, rows: 22, seed }), [columns, seed]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
      {cols.map((col) => (
        <RainColumnView key={col.id} column={col} width={width} height={height} />
      ))}
    </View>
  );
}

function RainColumnView({
  column,
  width,
  height,
}: {
  column: ReturnType<typeof buildRainColumns>[number];
  width: number;
  height: number;
}) {
  const fall = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(column.delayMs),
        Animated.timing(fall, { toValue: 1, duration: column.durationMs, useNativeDriver: true }),
        Animated.timing(fall, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [fall, column.delayMs, column.durationMs]);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-height, height] });
  const left = column.xFraction * (width - 22);

  return (
    <Animated.View style={[styles.column, { left, opacity: column.opacity, transform: [{ translateY }] }]}>
      {column.glyphs.map((g, i) => (
        <Text key={i} style={[styles.glyph, i === 0 ? styles.glyphHead : null]}>
          {g}
        </Text>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    overflow: "hidden",
  },
  column: {
    position: "absolute",
    top: 0,
    alignItems: "center",
  },
  glyph: {
    color: darkPalette.glowBronze,
    fontSize: 13,
    fontFamily: "monospace",
    lineHeight: 18,
    letterSpacing: 1,
  },
  glyphHead: {
    color: darkPalette.softGold,
    fontWeight: "700",
  },
});
