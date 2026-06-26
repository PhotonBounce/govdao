import { StyleSheet, Text, View } from "react-native";
import { SectionCard } from "../components/SectionCard";
import { ModulePill } from "../components/ModulePill";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PROPOSAL_TEMPLATES, ProposalTemplate } from "../data/proposalTemplateSource";
import { darkPalette, radii } from "../theme";

interface ProposalTemplatesScreenProps {
  onSelect: (template: ProposalTemplate) => void;
  onBack: () => void;
}

export function ProposalTemplatesScreen({ onSelect, onBack }: ProposalTemplatesScreenProps) {
  return (
    <>
      <SectionCard tone="glass" eyebrow="Quick Start" title="Proposal Templates" infoKey="create-proposal">
        <Text style={styles.lead}>Pick a template to pre-fill the proposal form, then edit the bracketed fields.</Text>
        <AnimatedPressable onPress={onBack} sound="tap" intensity="subtle" style={styles.backLink}>
          <Text style={styles.backText}>← Back to blank proposal</Text>
        </AnimatedPressable>
      </SectionCard>

      <View style={styles.list}>
        {PROPOSAL_TEMPLATES.map((tpl) => (
          <AnimatedPressable key={tpl.id} onPress={() => onSelect(tpl)} sound="tap" intensity="subtle" style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.glyph}>{tpl.glyph}</Text>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>{tpl.name}</Text>
                <ModulePill label={tpl.category.toUpperCase()} tone="bronze" />
              </View>
            </View>
            <Text style={styles.cardBody} numberOfLines={3}>{tpl.summary}</Text>
            <Text style={styles.useLink}>Use this template →</Text>
          </AnimatedPressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  lead: { color: darkPalette.dimWhite, fontSize: 13, lineHeight: 19, marginBottom: 10 },
  backLink: { alignSelf: "flex-start", paddingVertical: 4 },
  backText: { color: darkPalette.softGold, fontSize: 13, fontWeight: "600" },
  list: { gap: 12, marginBottom: 16 },
  card: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: darkPalette.glassBorder, borderRadius: radii.card, padding: 16, gap: 8 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  glyph: { fontSize: 26, color: darkPalette.softGold },
  cardTitleWrap: { flex: 1, gap: 4 },
  cardTitle: { color: darkPalette.dimWhite, fontSize: 16, fontWeight: "700" },
  cardBody: { color: "rgba(224,219,208,0.6)", fontSize: 12, lineHeight: 17 },
  useLink: { color: darkPalette.softGold, fontSize: 13, fontWeight: "700" },
});
