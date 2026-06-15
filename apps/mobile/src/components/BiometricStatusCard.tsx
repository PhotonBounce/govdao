import { StyleSheet, Text, View } from "react-native";
import { SectionCard } from "./SectionCard";
import { ModulePill } from "./ModulePill";
import { BiometricStatus, describeBiometricStatus } from "../data/biometricConfig";
import { darkPalette } from "../theme";

interface BiometricStatusCardProps {
  status: BiometricStatus;
}

function tone(status: BiometricStatus): "pine" | "bronze" | "rose" {
  if (status.required && status.available && status.enrolled) return "pine";
  if (status.required && (!status.available || !status.enrolled)) return "rose";
  return "bronze";
}

function label(status: BiometricStatus): string {
  if (!status.required) return "OPTIONAL";
  if (status.available && status.enrolled) return "ACTIVE";
  if (!status.available) return "NO HARDWARE";
  return "NOT ENROLLED";
}

export function BiometricStatusCard({ status }: BiometricStatusCardProps) {
  return (
    <SectionCard tone="glass" eyebrow="Security" title="Biometric Confirmation" infoKey="app-settings">
      <View style={styles.row}>
        <ModulePill label={label(status)} tone={tone(status)} />
      </View>
      <Text style={styles.detail}>{describeBiometricStatus(status)}</Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detail: {
    color: darkPalette.dimWhite,
    fontSize: 13,
    lineHeight: 19,
  },
});
