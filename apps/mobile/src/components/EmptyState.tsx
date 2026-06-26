import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette, darkPalette, radii } from "../theme";

interface EmptyStateProps {
  glyph: string;
  title: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
  tone?: "light" | "dark";
}

/**
 * A considered empty state — glyph, headline, one line of guidance, and an
 * optional call to action — instead of a bare sentence. Makes "nothing here
 * yet" feel intentional, and on actionable screens (e.g. an empty proposal
 * feed on a fresh DAO) it invites the very first action.
 */
export function EmptyState({ glyph, title, message, ctaLabel, onCta, tone = "light" }: EmptyStateProps) {
  const dark = tone === "dark";
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.glyph, dark && styles.glyphDark]}>{glyph}</Text>
      <Text style={[styles.title, dark && styles.titleDark]}>{title}</Text>
      <Text style={[styles.message, dark && styles.messageDark]}>{message}</Text>
      {ctaLabel && onCta ? (
        <Pressable style={styles.cta} onPress={onCta} accessibilityRole="button" accessibilityLabel={ctaLabel}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 12
  },
  glyph: {
    fontSize: 34,
    marginBottom: 10,
    color: palette.bronze
  },
  glyphDark: {
    color: darkPalette.softGold
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.graphite,
    marginBottom: 6,
    textAlign: "center"
  },
  titleDark: {
    color: darkPalette.dimWhite
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.inkSoft,
    textAlign: "center",
    maxWidth: 280
  },
  messageDark: {
    color: "rgba(224,219,208,0.6)"
  },
  cta: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: palette.graphite
  },
  ctaText: {
    color: palette.paper,
    fontSize: 14,
    fontWeight: "700"
  }
});
