import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SectionCard } from "../components/SectionCard";
import { ModulePill } from "../components/ModulePill";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { ActiveView } from "../shellTypes";
import { searchDestinations } from "../data/searchSource";
import { darkPalette } from "../theme";

interface SearchScreenProps {
  onJump: (view: ActiveView) => void;
}

export function SearchScreen({ onJump }: SearchScreenProps) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchDestinations(query), [query]);

  return (
    <>
      <SectionCard tone="glass" eyebrow="Quick Jump" title="Search" infoKey="search">
        <TextInput
          style={styles.input}
          placeholder="Jump to a screen — vote, treasury, calendar…"
          placeholderTextColor="rgba(224,219,208,0.4)"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <Text style={styles.hint}>
          {results.length} {results.length === 1 ? "destination" : "destinations"}
          {query.trim() ? ` matching "${query.trim()}"` : ""}
        </Text>
      </SectionCard>

      <SectionCard tone="glass" title="Destinations">
        {results.length === 0 ? (
          <Text style={styles.empty}>No screens match that. Try "vote", "funds", "stats" or "deploy".</Text>
        ) : (
          results.map((r) => (
            <AnimatedPressable key={r.view} onPress={() => onJump(r.view)} sound="tap" intensity="subtle" style={styles.row}>
              <View style={styles.rowText}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabel}>{r.label}</Text>
                  {r.premium ? <ModulePill label="PREMIUM" tone="bronze" /> : null}
                </View>
                <Text style={styles.rowDesc}>{r.description}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </AnimatedPressable>
          ))
        )}
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: darkPalette.glassBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: darkPalette.dimWhite,
    fontSize: 15,
  },
  hint: {
    color: "rgba(224,219,208,0.5)",
    fontSize: 12,
    marginTop: 10,
  },
  empty: {
    color: "rgba(224,219,208,0.6)",
    fontSize: 13,
    lineHeight: 19,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkPalette.mutedLine,
    gap: 10,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowLabel: {
    color: darkPalette.dimWhite,
    fontSize: 15,
    fontWeight: "700",
  },
  rowDesc: {
    color: "rgba(224,219,208,0.55)",
    fontSize: 12,
  },
  chevron: {
    color: darkPalette.glowBronze,
    fontSize: 24,
    fontWeight: "700",
  },
});
