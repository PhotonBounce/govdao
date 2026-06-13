import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { darkPalette, palette, radii } from "../theme";

interface SectionCardProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  tone?: "paper" | "graphite" | "glass";
}

export function SectionCard({ eyebrow, title, subtitle, children, tone = "paper" }: SectionCardProps) {
  const dark = tone === "graphite";
  const glass = tone === "glass";

  const cardStyle = glass ? styles.cardGlass : dark ? styles.cardDark : styles.cardLight;
  const textStyle = glass || dark ? styles.textOnDark : styles.textOnLight;
  const subtleStyle = glass ? styles.subtleOnGlass : dark ? styles.subtleOnDark : styles.subtleOnLight;
  const eyebrowStyle = glass ? styles.eyebrowGlass : dark || glass ? styles.textOnDark : styles.textOnLight;

  return (
    <View style={[styles.card, cardStyle]}>
      {eyebrow ? <Text style={[styles.eyebrow, eyebrowStyle]}>{eyebrow}</Text> : null}
      <Text style={[styles.title, textStyle]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, subtleStyle]}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1
  },
  cardLight: {
    backgroundColor: palette.paper,
    borderColor: palette.line
  },
  cardDark: {
    backgroundColor: palette.graphite,
    borderColor: "#3f372f"
  },
  cardGlass: {
    backgroundColor: darkPalette.glassCard,
    borderColor: darkPalette.glassBorder
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10
  },
  eyebrowGlass: {
    color: darkPalette.softGold
  },
  title: {
    fontSize: 24,
    fontWeight: "700"
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14
  },
  textOnDark: {
    color: palette.paper
  },
  textOnLight: {
    color: palette.graphite
  },
  subtleOnDark: {
    color: "#d1c4b2"
  },
  subtleOnGlass: {
    color: "rgba(224,219,208,0.70)"
  },
  subtleOnLight: {
    color: palette.inkSoft
  }
});