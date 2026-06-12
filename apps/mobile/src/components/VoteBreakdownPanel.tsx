import { StyleSheet, Text, View } from "react-native";
import { VoteTally, VoteChoice, choiceTone, deriveOutcome } from "../data/delegateSource";
import { ModulePill } from "./ModulePill";
import { palette } from "../theme";

interface VoteBreakdownPanelProps {
  tally: VoteTally;
}

const BAR_COLORS: Record<"pine" | "rose" | "bronze", string> = {
  pine: "#2d6a4f",
  rose: "#c1121f",
  bronze: "#8e5c32"
};

function ProgressBar({ pct, tone }: { pct: number; tone: "pine" | "rose" | "bronze" }) {
  return (
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          { width: `${Math.max(pct, 2)}%` as unknown as number, backgroundColor: BAR_COLORS[tone] }
        ]}
      />
    </View>
  );
}

const CHOICE_LABEL_COLOR: Record<VoteChoice, string> = {
  For: "#2d6a4f",
  Against: "#c1121f",
  Abstain: palette.bronze
};

export function VoteBreakdownPanel({ tally }: VoteBreakdownPanelProps) {
  const outcome = deriveOutcome(tally);
  const outcomeTone = outcome === "Passed" ? "pine" : outcome === "Defeated" ? "rose" : "bronze";

  return (
    <>
      <View style={styles.outcomeRow}>
        <ModulePill label={outcome.toUpperCase()} tone={outcomeTone} />
        <Text style={styles.totalLine}>{tally.total} member{tally.total !== 1 ? "s" : ""} voted</Text>
      </View>

      <View style={styles.tallyRow}>
        {(["For", "Against", "Abstain"] as VoteChoice[]).map((choice) => {
          const count = choice === "For" ? tally.forCount : choice === "Against" ? tally.againstCount : tally.abstainCount;
          const pct = choice === "For" ? tally.forPct : choice === "Against" ? tally.againstPct : tally.abstainPct;
          const tone = choiceTone(choice);
          return (
            <View key={choice} style={styles.tallyBlock}>
              <Text style={styles.tallyCount}>{count}</Text>
              <Text style={[styles.tallyLabel, { color: CHOICE_LABEL_COLOR[choice] }]}>{choice}</Text>
              <ProgressBar pct={pct} tone={tone} />
              <Text style={styles.tallyPct}>{pct}%</Text>
            </View>
          );
        })}
      </View>

      {tally.voters.map((voter) => (
        <View key={voter.address} style={styles.voterRow}>
          <Text style={styles.voterName}>{voter.displayName}</Text>
          <ModulePill label={voter.choice.toUpperCase()} tone={choiceTone(voter.choice)} />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  outcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14
  },
  totalLine: {
    color: palette.inkSoft,
    fontSize: 13
  },
  tallyRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14
  },
  tallyBlock: {
    flex: 1,
    backgroundColor: "rgba(217, 205, 184, 0.28)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center"
  },
  tallyCount: {
    fontSize: 26,
    fontWeight: "800",
    color: palette.graphite,
    marginBottom: 2
  },
  tallyLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8
  },
  tallyPct: {
    color: palette.inkSoft,
    fontSize: 11,
    marginTop: 4
  },
  barTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(93, 81, 72, 0.14)",
    borderRadius: 2,
    overflow: "hidden"
  },
  barFill: {
    height: 4,
    borderRadius: 2
  },
  voterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(93, 81, 72, 0.10)"
  },
  voterName: {
    color: palette.graphite,
    fontSize: 14,
    fontWeight: "600"
  }
});
