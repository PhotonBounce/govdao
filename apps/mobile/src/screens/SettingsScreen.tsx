import { ReactNode } from "react";
import { Linking, Pressable, StyleSheet, Text } from "react-native";
import { SectionCard } from "../components/SectionCard";
import { SignalRow } from "../components/SignalRow";
import { PreferencesPanel } from "../components/PreferencesPanel";
import { AppManifest } from "../types";
import { palette, radii } from "../theme";

interface SettingsScreenProps {
  manifest: AppManifest;
  metadataConfigured: boolean;
  supportConfigured: boolean;
  notificationPanel?: ReactNode;
}

function openExternalUrl(url: string) {
  Linking.openURL(url).catch(() => {
    // Swallow: a failed link-out should not crash the settings surface.
  });
}

function DisclosureLink({ label, url, target }: { label: string; url: string; target?: string }) {
  return (
    <Pressable style={styles.linkRow} onPress={() => openExternalUrl(target ?? url)}>
      <Text style={styles.linkLabel}>{label}</Text>
      <Text style={styles.linkValue}>{url}</Text>
    </Pressable>
  );
}

export function SettingsScreen({ manifest, metadataConfigured, supportConfigured, notificationPanel }: SettingsScreenProps) {
  return (
    <>
      <PreferencesPanel />

      {notificationPanel}

      <SectionCard
        eyebrow="Release Ops"
        title="Support And Legal"
        subtitle="Store review requires these disclosures to be reachable from inside the app, not just listed in the manifest."
      >
        <DisclosureLink label="Privacy Policy" url={manifest.support.privacyPolicyUrl} />
        <DisclosureLink label="Terms Of Service" url={manifest.support.termsOfServiceUrl} />
        <DisclosureLink label="Support Site" url={manifest.support.website} />
        <DisclosureLink label="Support Email" url={manifest.support.email} target={`mailto:${manifest.support.email}`} />
        <Text style={styles.metaLine}>Legal entity {manifest.support.legalName}</Text>
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
  linkRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(93, 81, 72, 0.12)"
  },
  linkLabel: {
    color: palette.graphite,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2
  },
  linkValue: {
    color: palette.bronze,
    fontSize: 13,
    fontWeight: "600"
  },
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