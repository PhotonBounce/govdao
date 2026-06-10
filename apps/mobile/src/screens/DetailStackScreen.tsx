import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BreadcrumbTrail } from "../components/BreadcrumbTrail";
import { ModulePill } from "../components/ModulePill";
import { SectionCard } from "../components/SectionCard";
import { SignalRow } from "../components/SignalRow";
import { ActiveView, DetailState } from "../shellTypes";
import { palette, radii } from "../theme";

interface DetailAction {
  label: string;
  view: ActiveView;
  secondary?: boolean;
}

interface RelatedDetailLink {
  label: string;
  detail: DetailState;
}

interface DetailStackScreenProps {
  activeView: ActiveView;
  detailStack: DetailState[];
  currentDetail: DetailState;
  actions: DetailAction[];
  relatedDetails: RelatedDetailLink[];
  votePanel?: ReactNode;
  onBack: () => void;
  onOpenView: (view: ActiveView) => void;
  onJumpToDetail: (index: number) => void;
  onOpenRelatedDetail: (detail: DetailState) => void;
}

export function DetailStackScreen({
  activeView,
  detailStack,
  currentDetail,
  actions,
  relatedDetails,
  votePanel,
  onBack,
  onOpenView,
  onJumpToDetail,
  onOpenRelatedDetail
}: DetailStackScreenProps) {
  const tone = currentDetail.tone ?? "paper";
  const dark = tone === "graphite";

  return (
    <>
      <SectionCard
        eyebrow="Detail Route"
        title={currentDetail.title}
        subtitle={`Path ${activeView} / ${detailStack.map((detail) => detail.kind).join(" / ")}`}
        tone={tone}
      >
        <BreadcrumbTrail
          tone={tone}
          baseLabel={activeView.toUpperCase()}
          items={detailStack.map((detail) => ({
            key: `${detail.kind}-${detail.refId}`,
            label: detail.refId
          }))}
          onBasePress={() => onOpenView(activeView)}
          onItemPress={onJumpToDetail}
        />
        <View style={styles.detailHeaderRow}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <ModulePill label={currentDetail.kind.toUpperCase()} tone={dark ? "rose" : "pine"} />
        </View>
        <Text style={dark ? styles.darkMeta : styles.metaLine}>Stack depth {detailStack.length}</Text>
      </SectionCard>

      <SectionCard eyebrow={currentDetail.eyebrow} title={currentDetail.title} subtitle={currentDetail.summary} tone={tone}>
        <SignalRow label="Owner" value={currentDetail.owner} tone={dark ? "neutral" : "good"} />
        <SignalRow label="Next step" value={currentDetail.nextStep} tone="warning" />
      </SectionCard>

      {votePanel}

      <SectionCard
        eyebrow="Context"
        title="Operational Notes"
        subtitle="Each selected item carries the release context a reviewer or operator would need before taking the next action."
        tone={tone}
      >
        {currentDetail.meta.map((item) => (
          <Text key={item} style={dark ? styles.darkMeta : styles.metaLine}>{item}</Text>
        ))}
      </SectionCard>

      {relatedDetails.length > 0 ? (
        <SectionCard
          eyebrow="Linked Routes"
          title="Continue Inside The Stack"
          subtitle="Stack navigation is more useful when a detail screen can open the next relevant record instead of forcing a tab reset."
          tone={tone}
        >
          {relatedDetails.map((linked) => (
            <Pressable key={`${linked.detail.kind}-${linked.detail.refId}`} style={styles.actionButtonAltStack} onPress={() => onOpenRelatedDetail(linked.detail)}>
              <Text style={styles.actionButtonAltText}>{linked.label}</Text>
            </Pressable>
          ))}
        </SectionCard>
      ) : null}

      <SectionCard
        eyebrow="Next Route"
        title="Continue The Flow"
        subtitle="Production clients should route operators toward the next relevant workspace instead of leaving them at a dead end."
        tone={tone}
      >
        {actions.map((action) => (
          <Pressable key={action.label} style={[styles.actionButton, action.secondary ? styles.actionButtonAlt : null]} onPress={() => onOpenView(action.view)}>
            <Text style={[styles.actionButtonText, action.secondary ? styles.actionButtonAltText : null]}>{action.label}</Text>
          </Pressable>
        ))}
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  detailHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8
  },
  backButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: palette.graphite
  },
  backButtonText: {
    color: palette.paper,
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.4
  },
  darkMeta: {
    color: "#d9d1c7",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
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
  actionButtonAltStack: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.card,
    backgroundColor: "rgba(251, 248, 239, 0.72)",
    borderWidth: 1,
    borderColor: palette.line
  },
  actionButtonText: {
    color: palette.paper,
    fontWeight: "700",
    fontSize: 14
  },
  actionButtonAltText: {
    color: palette.graphite,
    fontWeight: "700",
    fontSize: 14
  }
});