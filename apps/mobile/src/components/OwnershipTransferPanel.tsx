import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { AppManifest } from "../types";
import { buildContract, getActiveSigner, isFixtureMode } from "../data/walletProvider";
import { MEMBER_REGISTRY_ABI } from "../data/contractAbis";
import { AnimatedButton } from "./AnimatedButton";
import { SectionCard } from "./SectionCard";
import { darkPalette, radii } from "../theme";

interface OwnershipTransferPanelProps {
  manifest: AppManifest;
  currentAddress: string | null;
}

export function OwnershipTransferPanel({ manifest, currentAddress }: OwnershipTransferPanelProps) {
  const [newAdmin, setNewAdmin] = useState("");
  const [phase, setPhase] = useState<"idle" | "confirming" | "signing" | "done" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isValid = /^0x[0-9a-fA-F]{40}$/.test(newAdmin.trim()) && newAdmin.trim().toLowerCase() !== currentAddress?.toLowerCase();

  async function handleTransfer() {
    if (!isValid) return;
    if (isFixtureMode(manifest)) {
      Alert.alert("Demo Mode", "Connect your wallet on Polygon to transfer admin role on-chain.");
      return;
    }

    Alert.alert(
      "Transfer Admin Role",
      `You are about to permanently transfer your ADMIN role to:\n\n${newAdmin.trim()}\n\nThis cannot be undone without a governance vote. Are you sure?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Transfer",
          style: "destructive",
          onPress: async () => {
            setPhase("signing");
            setErrorMsg(null);
            try {
              const signer = getActiveSigner();
              if (!signer) throw new Error("No wallet connected.");
              const registry = buildContract(manifest.contracts.memberRegistry, MEMBER_REGISTRY_ABI, signer);
              const tx = await registry.transferAdminRole(newAdmin.trim());
              setPhase("signing");
              const receipt = await tx.wait();
              setTxHash(receipt?.hash ?? tx.hash);
              setPhase("done");
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Transaction failed.";
              if (msg.includes("user rejected") || msg.includes("User denied")) {
                setPhase("idle");
              } else {
                setErrorMsg(msg.includes("not admin") ? "Your wallet does not hold the ADMIN role." : msg);
                setPhase("error");
              }
            }
          }
        }
      ]
    );
  }

  if (phase === "done" && txHash) {
    return (
      <SectionCard eyebrow="Transfer Complete" title="Admin Role Transferred" infoKey="ownership-transfer">
        <Text style={styles.successText}>
          The ADMIN role has been transferred. Your wallet no longer has admin privileges.
        </Text>
        <Text style={styles.hashLabel}>Transaction</Text>
        <Text style={styles.hash}>{txHash.slice(0, 10)}…{txHash.slice(-8)}</Text>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      eyebrow="Ownership"
      title="Transfer Admin Role"
      subtitle="Hand full DAO control to another wallet or to the Timelock contract itself (self-governance). This action is irreversible without a governance vote."
      infoKey="ownership-transfer"
    >
      <Text style={styles.label}>New Admin Address</Text>
      <TextInput
        style={[styles.input, !isValid && newAdmin.length > 0 ? styles.inputError : null]}
        placeholder="0x…"
        placeholderTextColor="#6b6050"
        value={newAdmin}
        onChangeText={setNewAdmin}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />
      {newAdmin.length > 0 && !isValid && (
        <Text style={styles.hint}>
          {newAdmin.trim().toLowerCase() === currentAddress?.toLowerCase()
            ? "Cannot transfer to your own address."
            : "Enter a valid 0x Ethereum address."}
        </Text>
      )}

      <View style={styles.tipBox}>
        <Text style={styles.tipText}>
          💡 To make the DAO fully autonomous, transfer admin to the Timelock address:{"\n"}
          <Text style={styles.timelockAddr}>{manifest.contracts.timelock}</Text>
        </Text>
      </View>

      {phase === "error" && errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : null}

      <AnimatedButton
        label={phase === "signing" ? "Signing…" : "Transfer Admin Role"}
        variant="ghost"
        onPress={handleTransfer}
        disabled={!isValid || phase === "signing" || phase === "confirming"}
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: darkPalette.softGold ?? "#c98340",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: darkPalette.glassBorder ?? "#2a2535",
    borderRadius: radii.pill ?? 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#e8e4d8",
    fontSize: 14,
    fontFamily: "monospace",
    marginBottom: 8
  },
  inputError: {
    borderColor: "#c94040"
  },
  hint: {
    fontSize: 12,
    color: "#c94040",
    marginBottom: 8
  },
  tipBox: {
    backgroundColor: "rgba(201,131,64,0.08)",
    borderLeftWidth: 3,
    borderLeftColor: darkPalette.glowBronze ?? "#c98340",
    borderRadius: 8,
    padding: 12,
    marginVertical: 12
  },
  tipText: {
    fontSize: 13,
    color: "rgba(224,219,208,0.80)",
    lineHeight: 20
  },
  timelockAddr: {
    fontFamily: "monospace",
    fontSize: 11,
    color: darkPalette.softGold ?? "#c98340"
  },
  errorText: {
    color: "#c94040",
    fontSize: 13,
    marginBottom: 12
  },
  successText: {
    fontSize: 14,
    color: "rgba(224,219,208,0.85)",
    lineHeight: 22,
    marginBottom: 16
  },
  hashLabel: {
    fontSize: 11,
    color: darkPalette.softGold ?? "#c98340",
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 4
  },
  hash: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#7ab894"
  }
});
