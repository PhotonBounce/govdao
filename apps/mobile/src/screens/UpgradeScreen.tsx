import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { darkPalette, radii } from "../theme";
import { IapState, BillingPeriod, describeIapStatus } from "../data/iapConfig";

interface UpgradeScreenProps {
  onBack: () => void;
  iapState?: IapState;
  onPurchase?: (period: BillingPeriod) => void;
  onRestore?: () => void;
}

// Display pricing. The binding charge is set in the Play Console and fetched by
// RevenueCat; these are the marketing anchors the listing is configured to match.
const PRICING: Record<BillingPeriod, { price: string; cadence: string; perMonth: string; savings?: string }> = {
  monthly: { price: "$12", cadence: "per month", perMonth: "" },
  annual: { price: "$96", cadence: "per year", perMonth: "$8/mo billed annually", savings: "SAVE 33%" },
};

// The objections that stop a governance-app purchase, answered up front. Lowering
// perceived risk at the point of decision is the highest-leverage copy on the page.
const FAQ: { q: string; a: string }[] = [
  { q: "Can I cancel anytime?", a: "Yes. Manage or cancel in Google Play in two taps — you keep Premium until the period you already paid for ends." },
  { q: "Do you need my wallet or seed phrase?", a: "Never. Premium is tied to your Google account, not your wallet. On-chain actions are always signed by your own wallet on your device." },
  { q: "What data do you collect?", a: "No name, email, or personal data. The app reads governance state straight from your RPC endpoint — there's no backend account to create." },
  { q: "Can I try it before deploying contracts?", a: "Yes. Demo mode runs every feature on realistic sample data, so you can explore Premium fully before going live on-chain." },
];

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

export function UpgradeScreen({ onBack, iapState, onPurchase, onRestore }: UpgradeScreenProps) {
  const premium = iapState?.premium === true;
  const [period, setPeriod] = useState<BillingPeriod>("annual");
  const pricing = PRICING[period];
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

          {!premium ? (
            <View style={styles.periodToggle}>
              {(["monthly", "annual"] as BillingPeriod[]).map((p) => {
                const active = period === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPeriod(p)}
                    style={[styles.periodOption, active && styles.periodOptionActive]}
                  >
                    <Text style={[styles.periodOptionText, active && styles.periodOptionTextActive]}>
                      {p === "monthly" ? "Monthly" : "Annual"}
                    </Text>
                    {p === "annual" && PRICING.annual.savings ? (
                      <View style={styles.savingsPill}>
                        <Text style={styles.savingsPillText}>{PRICING.annual.savings}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.priceRow}>
            <Text style={[styles.tierPrice, styles.tierPricePremium]}>{pricing.price}</Text>
            <Text style={[styles.tierPriceSub, styles.tierPriceSubPremium]}>{pricing.cadence}</Text>
          </View>
          {pricing.perMonth ? <Text style={styles.perMonthNote}>{pricing.perMonth}</Text> : null}

          {PREMIUM_FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureCheckPremium}>✦</Text>
              <Text style={[styles.featureText, styles.featureTextPremium]}>{f}</Text>
            </View>
          ))}
          <Pressable style={[styles.upgradeButton, premium && styles.upgradeButtonDone]} onPress={premium ? undefined : () => onPurchase?.(period)} disabled={premium}>
            <Text style={styles.upgradeButtonText}>
              {premium ? "Premium active ✓" : `Subscribe ${pricing.price}/${period === "annual" ? "yr" : "mo"} →`}
            </Text>
          </Pressable>
          {!premium ? <Text style={styles.reassurance}>Cancel anytime · No wallet required · Works in demo mode</Text> : null}
          {onRestore && !premium ? (
            <Pressable onPress={onRestore} style={styles.restoreButton}>
              <Text style={styles.restoreButtonText}>Restore purchases</Text>
            </Pressable>
          ) : null}
          {iapState ? <Text style={styles.iapDetail}>{iapState.detail || describeIapStatus(iapState)}</Text> : null}
        </View>
      </View>

      <View style={styles.faq}>
        <Text style={styles.faqTitle}>Before you decide</Text>
        {FAQ.map((item) => (
          <View key={item.q} style={styles.faqItem}>
            <Text style={styles.faqQ}>{item.q}</Text>
            <Text style={styles.faqA}>{item.a}</Text>
          </View>
        ))}
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
  periodToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: radii.pill,
    padding: 4,
    marginBottom: 14,
    gap: 4
  },
  periodOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: radii.pill
  },
  periodOptionActive: {
    backgroundColor: darkPalette.glowBronze
  },
  periodOptionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(224,219,208,0.65)"
  },
  periodOptionTextActive: {
    color: "#0d0d1a"
  },
  savingsPill: {
    backgroundColor: "rgba(92,155,115,0.9)",
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  savingsPillText: {
    color: "#0d0d1a",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8
  },
  perMonthNote: {
    fontSize: 12,
    color: "rgba(224,219,208,0.50)",
    marginTop: 2,
    marginBottom: 16
  },
  reassurance: {
    marginTop: 10,
    fontSize: 11,
    color: "rgba(224,219,208,0.55)",
    textAlign: "center"
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
  upgradeButtonDone: {
    backgroundColor: "rgba(92,155,115,0.85)"
  },
  restoreButton: {
    marginTop: 12,
    alignItems: "center"
  },
  restoreButtonText: {
    color: darkPalette.softGold,
    fontSize: 13,
    fontWeight: "600"
  },
  iapDetail: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(224,219,208,0.55)",
    textAlign: "center"
  },
  faq: {
    marginBottom: 24,
    gap: 14
  },
  faqTitle: {
    color: darkPalette.softGold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 2
  },
  faqItem: {
    gap: 4
  },
  faqQ: {
    color: darkPalette.dimWhite,
    fontSize: 15,
    fontWeight: "700"
  },
  faqA: {
    color: "rgba(224,219,208,0.62)",
    fontSize: 13,
    lineHeight: 20
  },
  footnote: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(224,219,208,0.40)",
    textAlign: "center"
  }
});
