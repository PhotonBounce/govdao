import { Pressable, StyleSheet, Text, View } from "react-native";
import { MemberItem } from "../data/mobileDataSource";
import { ModulePill } from "./ModulePill";
import { palette, radii } from "../theme";

interface MembersPanelProps {
  members: MemberItem[];
  onSelectMember: (member: MemberItem) => void;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function MembersPanel({ members, onSelectMember }: MembersPanelProps) {
  return (
    <View style={styles.container}>
      {members.length === 0 ? (
        <Text style={styles.emptyLine}>No member records loaded from the active feed.</Text>
      ) : null}
      {members.map((member) => (
        <Pressable key={member.id} style={styles.row} onPress={() => onSelectMember(member)}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{member.displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <View style={styles.topRow}>
              <Text style={styles.name}>{member.displayName}</Text>
              <ModulePill
                label={member.status === "Active" ? "ACTIVE" : member.status.toUpperCase()}
                tone={member.status === "Active" ? "pine" : "rose"}
              />
            </View>
            <Text style={styles.role}>{member.role}</Text>
            <Text style={styles.address}>{shortenAddress(member.address)}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(93, 81, 72, 0.10)",
    gap: 12
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.bronze,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  avatarText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700"
  },
  info: {
    flex: 1
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2
  },
  name: {
    color: palette.graphite,
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    marginRight: 8
  },
  role: {
    color: palette.inkSoft,
    fontSize: 13,
    lineHeight: 18
  },
  address: {
    color: palette.moss,
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "600",
    marginTop: 2
  },
  emptyLine: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20
  }
});
