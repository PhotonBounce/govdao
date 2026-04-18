import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { palette, radii } from "../theme";

interface SectionCardProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  tone?: "paper" | "graphite";
}

export function SectionCard({ eyebrow, title, subtitle, children, tone = "paper" }: SectionCardProps) {
  const dark = tone === "graphite";

  return (
    <View style={[styles.card, dark ? styles.cardDark : styles.cardLight]}>
      {eyebrow ? <Text style={[styles.eyebrow, dark ? styles.textOnDark : styles.textOnLight]}>{eyebrow}</Text> : null}
      <Text style={[styles.title, dark ? styles.textOnDark : styles.textOnLight]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, dark ? styles.subtleOnDark : styles.subtleOnLight]}>{subtitle}</Text> : null}
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
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10
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
  subtleOnLight: {
    color: palette.inkSoft
  }
});