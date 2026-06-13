import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { darkPalette, radii } from "../theme";

interface UpgradeScreenProps {
  onBack: () => void;
}

const FREE_FEATURES = [
  "View proposals and motions",
  "Cast votes on active proposals",
  "View treasury balance and movements",
  "Activity feed (read-only)",
  "Member directory",
  "Governance modules",
];

const PREMIUM_FEATURES = [
  "Everything in Free",
  "Guardian drill scheduling",
  "Member invite (with timelock)",
  "Delegate analytics dashboard",
  "Activity export (CSV/JSON)",
  "Contract deploy wizard",
  "Priority support",
];

export function UpgradeScreen({ onBack }: UpgradeScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <Text style={styles.eyebrow}>GOVDAO PREMIUM</Text>
      <Text style={styles.headline}>Unlock the full governance stack</Text>
      <Text style={styles.sub}>
        Free members get full transparency — votes, proposals, treasury, and activity feed. Premium unlocks the operational layer: guardian controls, member management, analytics, and export tools.
      </Text>

      <View style={styles.tierRow}>
        <View style={styles.tierCard}>
          <Text style={styles.tierName}>Free</Text>
          <Text style={styles.tierPrice}>$0</Text>
          <Text style={styles.tierPriceSub}>forever</Text>
          {FREE_FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.tierCard, styles.tierCardPremium]}>
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>RECOMMENDED</Text>
          </View>
          <Text style={[styles.tierName, styles.tierNamePremium]}>Premium</Text>
          <Text style={[styles.tierPrice, styles.tierPricePremium]}>$12</Text>
          <Text style={[styles.tierPriceSub, styles.tierPriceSubPremium]}>per month</Text>
          {PREMIUM_FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureCheckPremium}>✦</Text>
              <Text style={[styles.featureText, styles.featureTextPremium]}>{f}</Text>
            </View>
          ))}
          <Pressable style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Subscribe via Google Play →</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.footnote}>
        Subscriptions are managed through Google Play. Cancel any time. Premium plan is tied to this installation's Google account — not the connected wallet address.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40
  },
  backButton: {
    paddingVertical: 10,
    marginBottom: 8
  },
  backButtonText: {
    color: darkPalette.softGold,
    fontSize: 15,
    fontWeight: "700"
  },
  eyebrow: {
    color: darkPalette.softGold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 10
  },
  headline: {
    fontSize: 32,
    fontWeight: "700",
    color: darkPalette.dimWhite,
    lineHeight: 36,
    marginBottom: 12
  },
  sub: {
    fontSize: 15,
    lineHeight: 24,
    color: "rgba(224,219,208,0.72)",
    marginBottom: 28
  },
  tierRow: {
    gap: 16,
    marginBottom: 24
  },
  tierCard: {
    backgroundColor: darkPalette.glassCard,
    borderWidth: 1,
    borderColor: darkPalette.mutedLine,
    borderRadius: radii.card,
    padding: 20
  },
  tierCardPremium: {
    borderColor: darkPalette.glowBronze,
    backgroundColor: "rgba(201,131,64,0.06)"
  },
  popularBadge: {
    backgroundColor: darkPalette.glowBronze,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12
  },
  popularBadgeText: {
    color: "#0d0d1a",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8
  },
  tierName: {
    fontSize: 20,
    fontWeight: "700",
    color: "rgba(224,219,208,0.60)",
    marginBottom: 6
  },
  tierNamePremium: {
    color: darkPalette.softGold
  },
  tierPrice: {
    fontSize: 40,
    fontWeight: "700",
    color: "rgba(224,219,208,0.60)",
    lineHeight: 44
  },
  tierPricePremium: {
    color: darkPalette.dimWhite
  },
  tierPriceSub: {
    fontSize: 13,
    color: "rgba(224,219,208,0.40)",
    marginBottom: 16
  },
  tierPriceSubPremium: {
    color: "rgba(224,219,208,0.60)"
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8
  },
  featureCheck: {
    color: "rgba(224,219,208,0.50)",
    fontSize: 14,
    marginRight: 10,
    marginTop: 1
  },
  featureCheckPremium: {
    color: darkPalette.softGold,
    fontSize: 12,
    marginRight: 10,
    marginTop: 2
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(224,219,208,0.60)",
    flex: 1
  },
  featureTextPremium: {
    color: "rgba(224,219,208,0.85)"
  },
  upgradeButton: {
    marginTop: 20,
    backgroundColor: darkPalette.glowBronze,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: "center"
  },
  upgradeButtonText: {
    color: "#0d0d1a",
    fontSize: 15,
    fontWeight: "700"
  },
  footnote: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(224,219,208,0.40)",
    textAlign: "center"
  }
});
