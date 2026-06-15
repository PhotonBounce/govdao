import { StyleSheet, Text } from "react-native";
import { SectionCard } from "./SectionCard";
import { ModulePill } from "./ModulePill";
import { AnimatedPressable } from "./AnimatedPressable";
import { ReminderController } from "../hooks/useGovernanceReminders";
import { darkPalette, radii } from "../theme";

interface GovernanceRemindersCardProps {
  controller: ReminderController;
  upcomingCount: number;
}

export function GovernanceRemindersCard({ controller, upcomingCount }: GovernanceRemindersCardProps) {
  return (
    <SectionCard tone="glass" eyebrow="Stay Ahead" title="Reminders" infoKey="governance-calendar">
      <Text style={styles.detail}>{controller.detail}</Text>
      {controller.supported ? (
        <AnimatedPressable onPress={controller.schedule} sound="tap" intensity="subtle" style={styles.button}>
          <Text style={styles.buttonText}>
            {controller.scheduledCount > 0 ? "Refresh reminders" : `Schedule ${upcomingCount} reminder${upcomingCount === 1 ? "" : "s"}`}
          </Text>
        </AnimatedPressable>
      ) : (
        <ModulePill label="NATIVE BUILD ONLY" tone="bronze" />
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  detail: {
    color: darkPalette.dimWhite,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  button: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: darkPalette.glowBronze,
    borderRadius: radii.card,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  buttonText: {
    color: darkPalette.softGold,
    fontSize: 14,
    fontWeight: "700",
  },
});
