import { Pressable, StyleSheet, Text } from "react-native";
import { darkPalette } from "../theme";

interface InfoButtonProps {
  onPress: () => void;
}

export function InfoButton({ onPress }: InfoButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button} hitSlop={8}>
      <Text style={styles.icon}>ⓘ</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: darkPalette.activeGlow,
    borderWidth: 1,
    borderColor: darkPalette.glassBorder
  },
  icon: {
    color: darkPalette.softGold,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18
  }
});
