import { Pressable, StyleSheet, Text } from "react-native";
import { palette, radii } from "../theme";

interface NavTabProps {
  active: boolean;
  label: string;
  onPress: () => void;
}

export function NavTab({ active, label, onPress }: NavTabProps) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active ? styles.tabActive : styles.tabIdle]}>
      <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1
  },
  tabActive: {
    backgroundColor: palette.graphite,
    borderColor: palette.graphite
  },
  tabIdle: {
    backgroundColor: "rgba(251, 248, 239, 0.72)",
    borderColor: palette.line
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4
  },
  labelActive: {
    color: palette.paper
  },
  labelIdle: {
    color: palette.inkSoft
  }
});