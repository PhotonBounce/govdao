import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette, radii } from "../theme";

interface BreadcrumbItem {
  key: string;
  label: string;
}

interface BreadcrumbTrailProps {
  tone: "paper" | "graphite";
  baseLabel: string;
  items: BreadcrumbItem[];
  onBasePress: () => void;
  onItemPress: (index: number) => void;
}

export function BreadcrumbTrail({ tone, baseLabel, items, onBasePress, onItemPress }: BreadcrumbTrailProps) {
  const dark = tone === "graphite";

  return (
    <View style={styles.row}>
      <Pressable style={[styles.chip, dark ? styles.chipDark : null]} onPress={onBasePress}>
        <Text style={[styles.text, dark ? styles.textDark : null]}>{baseLabel}</Text>
        {items.length > 0 ? <Text style={[styles.divider, dark ? styles.textDark : null]}>/</Text> : null}
      </Pressable>

      {items.map((item, index) => (
        <Pressable key={item.key} style={[styles.chip, dark ? styles.chipDark : null]} onPress={() => onItemPress(index)}>
          <Text style={[styles.text, dark ? styles.textDark : null]}>{item.label}</Text>
          {index < items.length - 1 ? <Text style={[styles.divider, dark ? styles.textDark : null]}>/</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
    marginBottom: 12
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: "rgba(217, 205, 184, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(142, 92, 50, 0.12)"
  },
  chipDark: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.1)"
  },
  text: {
    color: palette.graphite,
    fontSize: 12,
    fontWeight: "700"
  },
  textDark: {
    color: palette.paper
  },
  divider: {
    color: palette.inkSoft,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "700"
  }
});