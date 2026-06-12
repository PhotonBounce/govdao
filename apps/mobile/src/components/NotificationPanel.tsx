import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { ModulePill } from "./ModulePill";
import { SectionCard } from "./SectionCard";
import {
  DIGEST_FREQUENCIES,
  DigestFrequency,
  formatFrequency,
  NotificationCategory,
  NotificationPreferences,
  PreferenceSaveResult
} from "../data/notificationSource";
import { PreferenceSaveStatus } from "../hooks/useNotificationController";
import { palette, radii } from "../theme";

interface NotificationPanelProps {
  categories: NotificationCategory[];
  preferences: NotificationPreferences;
  saveStatus: PreferenceSaveStatus;
  saveResult: PreferenceSaveResult | null;
  saveError: string | null;
  onToggleCategory: (categoryId: string) => void;
  onSetFrequency: (frequency: DigestFrequency) => void;
  onSave: () => void;
}

export function NotificationPanel({
  categories,
  preferences,
  saveStatus,
  saveResult,
  saveError,
  onToggleCategory,
  onSetFrequency,
  onSave
}: NotificationPanelProps) {
  const isSaving = saveStatus === "validating" || saveStatus === "saving";

  return (
    <SectionCard
      eyebrow="Alerts"
      title="Notification Preferences"
      subtitle="Choose which governance events reach this device. Categories follow the features your deployment enables."
    >
      {categories.map((category) => (
        <View key={category.id} style={styles.categoryRow}>
          <View style={styles.categoryText}>
            <Text style={styles.categoryLabel}>{category.label}</Text>
            <Text style={styles.categoryDescription}>{category.description}</Text>
          </View>
          <Switch
            value={preferences.enabled[category.id] ?? false}
            onValueChange={() => onToggleCategory(category.id)}
            disabled={isSaving}
            trackColor={{ false: "rgba(93, 81, 72, 0.25)", true: palette.bronze }}
            thumbColor={palette.paper}
          />
        </View>
      ))}

      <Text style={styles.frequencyLabel}>Delivery</Text>
      <View style={styles.frequencyRow}>
        {DIGEST_FREQUENCIES.map((frequency) => (
          <Pressable
            key={frequency}
            style={[styles.frequencyPill, preferences.frequency === frequency && styles.frequencyPillActive]}
            onPress={() => onSetFrequency(frequency)}
            disabled={isSaving}
          >
            <Text style={[styles.frequencyPillText, preferences.frequency === frequency && styles.frequencyPillTextActive]}>
              {formatFrequency(frequency)}
            </Text>
          </Pressable>
        ))}
      </View>

      {saveStatus === "failed" && saveError ? <Text style={styles.errorLine}>{saveError}</Text> : null}
      {isSaving ? (
        <Text style={styles.progressLine}>
          {saveStatus === "validating" ? "Validating preferences…" : "Saving to the notification service…"}
        </Text>
      ) : null}

      {saveStatus === "saved" && saveResult ? (
        <View style={styles.savedBlock}>
          <View style={styles.pillRow}>
            <ModulePill label="SAVED" tone="pine" />
            <ModulePill label={saveResult.transport === "fixture" ? "FIXTURE SAVE" : "LIVE SAVE"} tone={saveResult.transport === "fixture" ? "rose" : "pine"} />
          </View>
          <Text style={styles.savedLine}>
            {saveResult.enabledCount} categor{saveResult.enabledCount === 1 ? "y" : "ies"} on, {formatFrequency(saveResult.frequency).toLowerCase()} delivery.
            {saveResult.endpoint
              ? ` Will sync to ${saveResult.endpoint} once live submission is wired.`
              : " The hosted notification service is still placeholder-backed."}
          </Text>
        </View>
      ) : (
        <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={onSave} disabled={isSaving}>
          <Text style={styles.saveButtonText}>{isSaving ? "Saving…" : "Save Preferences"}</Text>
        </Pressable>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(93, 81, 72, 0.12)"
  },
  categoryText: {
    flex: 1
  },
  categoryLabel: {
    color: palette.graphite,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2
  },
  categoryDescription: {
    color: palette.inkSoft,
    fontSize: 13,
    lineHeight: 18
  },
  frequencyLabel: {
    color: palette.graphite,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8
  },
  frequencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12
  },
  frequencyPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(142, 92, 50, 0.22)",
    backgroundColor: "rgba(217, 205, 184, 0.18)"
  },
  frequencyPillActive: {
    backgroundColor: palette.bronze,
    borderColor: palette.bronze
  },
  frequencyPillText: {
    color: palette.inkSoft,
    fontSize: 12,
    fontWeight: "600"
  },
  frequencyPillTextActive: {
    color: "#fff"
  },
  errorLine: {
    color: palette.rose,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8
  },
  progressLine: {
    color: palette.moss,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 8
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6
  },
  savedBlock: {
    marginTop: 4
  },
  savedLine: {
    color: palette.inkSoft,
    fontSize: 13,
    lineHeight: 19
  },
  saveButton: {
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    backgroundColor: palette.graphite
  },
  saveButtonDisabled: {
    opacity: 0.45
  },
  saveButtonText: {
    color: palette.paper,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center"
  }
});
