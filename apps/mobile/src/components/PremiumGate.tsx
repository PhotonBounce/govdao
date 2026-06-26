import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PlanGateResult } from "../hooks/usePlanGate";
import { darkPalette, palette, radii } from "../theme";

interface PremiumGateProps {
  gate: PlanGateResult;
  children: ReactNode;
  onUpgrade?: () => void;
}

export function PremiumGate({ gate, children, onUpgrade }: PremiumGateProps) {
  if (gate.allowed) {
    return <>{children}</>;
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.lock}>🔒</Text>
      <Text style={styles.title}>{gate.label}</Text>
      <Text style={styles.subtitle}>{gate.benefit}</Text>
      <Text style={styles.alsoLine}>Premium also unlocks analytics, member invites, drills, the deploy wizard, and ad-free use.</Text>
      <View style={styles.pillRow}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>FREE</Text>
        </View>
        <View style={[styles.pill, styles.pillPremium]}>
          <Text style={[styles.pillLabel, styles.pillLabelPremium]}>PREMIUM →</Text>
        </View>
      </View>
      {onUpgrade ? (
        <>
          <Pressable style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>Unlock {gate.label}</Text>
          </Pressable>
          <Text style={styles.priceAnchor}>From $8/mo billed annually · Cancel anytime</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: darkPalette.glassCard,
    borderWidth: 1,
    borderColor: darkPalette.glassBorder,
    borderRadius: radii.card,
    padding: 24,
    marginBottom: 16,
    alignItems: "center"
  },
  lock: {
    fontSize: 36,
    marginBottom: 12
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: darkPalette.dimWhite,
    marginBottom: 8,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(224,219,208,0.72)",
    textAlign: "center",
    marginBottom: 12
  },
  alsoLine: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(224,219,208,0.45)",
    textAlign: "center",
    marginBottom: 16
  },
  priceAnchor: {
    fontSize: 12,
    color: "rgba(224,219,208,0.55)",
    textAlign: "center",
    marginTop: 10
  },
  pillRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: darkPalette.mutedLine,
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  pillPremium: {
    borderColor: darkPalette.glowBronze,
    backgroundColor: darkPalette.activeGlow
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(224,219,208,0.50)"
  },
  pillLabelPremium: {
    color: darkPalette.softGold
  },
  upgradeButton: {
    backgroundColor: darkPalette.glowBronze,
    borderRadius: radii.pill,
    paddingHorizontal: 24,
    paddingVertical: 14
  },
  upgradeButtonText: {
    color: "#0d0d1a",
    fontSize: 15,
    fontWeight: "700"
  }
});
