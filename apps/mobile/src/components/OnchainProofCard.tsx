import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SectionCard } from "./SectionCard";
import { liveContracts } from "../data/onchainProof";
import { AppManifest } from "../types";
import { darkPalette, radii } from "../theme";

interface OnchainProofCardProps {
  manifest: AppManifest;
}

function shorten(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Trust signal: proves the governance stack is real and independently verifiable.
 * Every contract row deep-links to the block explorer so anyone can confirm the
 * deployment with their own eyes — the strongest possible "this is legit" cue.
 * Renders nothing in demo/placeholder mode so it never shows fake addresses.
 */
export function OnchainProofCard({ manifest }: OnchainProofCardProps) {
  const explorer = manifest.chain.blockExplorer?.replace(/\/$/, "");
  const live = liveContracts(manifest);

  // Only a genuinely deployed stack earns the trust badge.
  if (!explorer || live.length === 0) {
    return null;
  }

  const open = (address: string) => {
    Linking.openURL(`${explorer}/address/${address}`).catch(() => {
      // A failed link-out should never crash the overview surface.
    });
  };

  return (
    <SectionCard
      eyebrow="Verifiable"
      title="Live on Polygon"
      subtitle="Don't take our word for it. Every contract below is deployed on Polygon mainnet — tap any one to inspect it on Polygonscan yourself."
      tone="graphite"
      infoKey="member-registry"
    >
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✓ {live.length} CONTRACTS DEPLOYED</Text>
        </View>
        <View style={[styles.badge, styles.badgeAlt]}>
          <Text style={[styles.badgeText, styles.badgeTextAlt]}>POLYGON MAINNET</Text>
        </View>
      </View>

      {live.map((c) => (
        <Pressable key={c.label} style={styles.row} onPress={() => open(c.address)}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowLabel}>{c.label}</Text>
            <Text style={styles.rowAddress}>{shorten(c.address)}</Text>
          </View>
          <Text style={styles.rowLink}>View ↗</Text>
        </Pressable>
      ))}

      <Text style={styles.footnote}>
        Open-source, audited patterns. No hidden backend — the app reads governance state straight from these contracts.
      </Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6
  },
  badge: {
    backgroundColor: "rgba(92,155,115,0.18)",
    borderWidth: 1,
    borderColor: "rgba(92,155,115,0.5)",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  badgeAlt: {
    backgroundColor: "rgba(201,131,64,0.14)",
    borderColor: "rgba(201,131,64,0.45)"
  },
  badgeText: {
    color: "#8fd0a6",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6
  },
  badgeTextAlt: {
    color: darkPalette.softGold
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)"
  },
  rowLeft: {
    flex: 1
  },
  rowLabel: {
    color: "#e8e1d4",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2
  },
  rowAddress: {
    color: "rgba(224,219,208,0.5)",
    fontSize: 12,
    fontFamily: "monospace"
  },
  rowLink: {
    color: darkPalette.softGold,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 12
  },
  footnote: {
    color: "rgba(224,219,208,0.45)",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12
  }
});
