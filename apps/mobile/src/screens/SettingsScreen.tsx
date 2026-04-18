import { Pressable, StyleSheet, Text } from "react-native";
import { SectionCard } from "../components/SectionCard";
import { SignalRow } from "../components/SignalRow";
import { AppManifest } from "../types";
import { palette, radii } from "../theme";

interface SettingsScreenProps {
  manifest: AppManifest;
  metadataConfigured: boolean;
  supportConfigured: boolean;
}

export function SettingsScreen({ manifest, metadataConfigured, supportConfigured }: SettingsScreenProps) {
  return (
    <>
      <SectionCard
        eyebrow="Release Ops"
        title="Submission Checklist"
        subtitle="This shell is wired for Google Play internal track testing. The remaining gap is the production backend and device QA, not the manifest or release schema."
      >
        <Text style={styles.metaLine}>Privacy {manifest.support.privacyPolicyUrl}</Text>
        <Text style={styles.metaLine}>Terms {manifest.support.termsOfServiceUrl}</Text>
        <Text style={styles.metaLine}>Support {manifest.support.email}</Text>
        <Text style={styles.metaLine}>Services {manifest.app.distribution.hostedServices.join(", ")}</Text>
      </SectionCard>

      <SectionCard
        eyebrow="Environment"
        title="App Wiring"
        subtitle="These values are the highest-risk release settings because they control where members, proposals, and support traffic actually land."
      >
        <SignalRow label="Bundle ID" value={manifest.app.bundleId} />
        <SignalRow label="Android track" value={manifest.release.android.track} />
        <SignalRow label="Metadata API" value={metadataConfigured ? "Configured" : "Placeholder"} tone={metadataConfigured ? "good" : "warning"} />
        <SignalRow label="Support URLs" value={supportConfigured ? "Configured" : "Placeholder"} tone={supportConfigured ? "good" : "warning"} />
      </SectionCard>

      <SectionCard
        eyebrow="Actions"
        title="Operator Next Steps"
        subtitle="These are the minimum promotion moves before the internal-track build becomes a real review candidate."
      >
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Promote Manifest To Production Values</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.actionButtonAlt]}>
          <Text style={[styles.actionButtonText, styles.actionButtonAltText]}>Run Internal Device Pilot</Text>
        </Pressable>
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  metaLine: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  actionButton: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.card,
    backgroundColor: palette.graphite
  },
  actionButtonAlt: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: palette.line
  },
  actionButtonText: {
    color: palette.paper,
    fontWeight: "700",
    fontSize: 14
  },
  actionButtonAltText: {
    color: palette.graphite
  }
});