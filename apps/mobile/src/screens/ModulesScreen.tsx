import { Pressable, StyleSheet, Text, View } from "react-native";
import { ModulePill } from "../components/ModulePill";
import { SectionCard } from "../components/SectionCard";
import { WorkspaceItem } from "../data/mobileDataSource";
import { palette } from "../theme";
import { AppManifest } from "../types";

type ModuleItem = AppManifest["experiences"]["modules"][number];

interface ModulesScreenProps {
  modules: ModuleItem[];
  sessionActive: boolean;
  workspaceModuleTitle?: string;
  workspaceItems: WorkspaceItem[];
  onSelectModule: (module: ModuleItem) => void;
  onSelectWorkspace: (item: WorkspaceItem) => void;
}

export function ModulesScreen({ modules, sessionActive, workspaceModuleTitle, workspaceItems, onSelectModule, onSelectWorkspace }: ModulesScreenProps) {
  return (
    <>
      {modules.map((module) => {
        const locked = module.requiresAuth && !sessionActive;

        return (
          <Pressable key={module.id} onPress={() => onSelectModule(module)}>
            <SectionCard
              eyebrow={module.kind}
              title={module.title}
              subtitle={`Entry route ${module.entryRoute}. ${module.requiresAuth ? "Authentication required." : "Guest access supported."}`}
            >
              {locked ? (
                <View style={styles.lockRow}>
                  <ModulePill label="SIGN IN REQUIRED" tone="rose" />
                </View>
              ) : null}
              <Text style={styles.metaLine}>API {module.apiBaseUrl}</Text>
              <Text style={styles.metaLine}>Web {module.webUrl}</Text>
              <Text style={styles.metaLine}>Role {module.requiresAuth ? "Authenticated members" : "Guest / public"}</Text>
              <Text style={styles.metaLine}>{locked ? "Sign in from the Member Access card to unlock launch actions" : "Tap to inspect this module's launch narrative"}</Text>
            </SectionCard>
          </Pressable>
        );
      })}

      {workspaceModuleTitle ? (
        <SectionCard
          eyebrow="Workspace Preview"
          title={`${workspaceModuleTitle} Queue`}
          subtitle="Companion modules should feel operational, not decorative. This queue previews the non-DAO workstream inside the same app shell."
        >
          {workspaceItems.length === 0 ? <Text style={styles.emptyLine}>No workspace items are available for the active module yet.</Text> : null}
          {workspaceItems.map((item) => (
            <Pressable key={item.id} style={styles.feedItem} onPress={() => onSelectWorkspace(item)}>
              <View style={styles.feedTopRow}>
                <Text style={styles.feedId}>{item.id}</Text>
                <ModulePill label={item.status} tone={item.status === "Ready" ? "pine" : "bronze"} />
              </View>
              <Text style={styles.feedTitle}>{item.title}</Text>
              <Text style={styles.feedSummary}>{item.type} • Owner {item.owner}</Text>
            </Pressable>
          ))}
        </SectionCard>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  lockRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4
  },
  metaLine: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  feedItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(93, 81, 72, 0.12)"
  },
  feedTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  feedId: {
    color: palette.bronze,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  feedTitle: {
    color: palette.graphite,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6
  },
  feedSummary: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6
  },
  emptyLine: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8
  }
});