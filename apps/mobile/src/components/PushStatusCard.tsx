import { StyleSheet, Text, View } from "react-native";
import { SectionCard } from "./SectionCard";
import { ModulePill } from "./ModulePill";
import { AnimatedPressable } from "./AnimatedPressable";
import { PushState, describePushStatus, shortenToken } from "../data/pushConfig";
import { darkPalette, radii } from "../theme";

interface PushStatusCardProps {
  state: PushState;
  onRegister: () => void;
}

function statusTone(status: PushState["status"]): "pine" | "bronze" | "rose" {
  if (status === "granted") return "pine";
  if (status === "denied" || status === "unsupported") return "rose";
  return "bronze";
}

export function PushStatusCard({ state, onRegister }: PushStatusCardProps) {
  return (
    <SectionCard tone="glass" eyebrow="Alerts" title="Push Notifications" infoKey="notification-preferences">
      <View style={styles.statusRow}>
        <ModulePill label={state.status.toUpperCase()} tone={statusTone(state.status)} />
        <Text style={styles.token}>{shortenToken(state.token)}</Text>
      </View>
      <Text style={styles.detail}>{describePushStatus(state.status)}</Text>
      {state.detail ? <Text style={styles.subDetail}>{state.detail}</Text> : null}
      {state.supported && state.status !== "granted" ? (
        <AnimatedPressable onPress={onRegister} sound="tap" intensity="subtle" style={styles.button}>
          <Text style={styles.buttonText}>Enable governance alerts</Text>
        </AnimatedPressable>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  token: {
    color: darkPalette.softGold,
    fontSize: 12,
    fontFamily: "monospace",
  },
  detail: {
    color: darkPalette.dimWhite,
    fontSize: 13,
    lineHeight: 19,
  },
  subDetail: {
    color: "rgba(224,219,208,0.55)",
    fontSize: 12,
    marginTop: 6,
  },
  button: {
    marginTop: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: darkPalette.glowBronze,
    borderRadius: radii.card,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  buttonText: {
    color: darkPalette.softGold,
    fontSize: 14,
    fontWeight: "700",
  },
});
