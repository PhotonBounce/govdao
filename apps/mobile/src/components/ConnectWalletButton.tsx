import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { connectInjectedWallet } from "../data/walletProvider";
import { brand, darkPalette, radii } from "../theme";

interface ConnectWalletButtonProps {
  chainId: number;
  onConnected: (address: string) => void;
}

/**
 * Renders a "Connect MetaMask" button on web. On native it renders nothing —
 * wallet connection is handled by WalletConnect in the native shell.
 */
export function ConnectWalletButton({ chainId, onConnected }: ConnectWalletButtonProps) {
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (Platform.OS !== "web") return null;

  async function handleConnect() {
    setStatus("pending");
    setErrorMsg("");
    try {
      const { address } = await connectInjectedWallet(chainId);
      setStatus("idle");
      onConnected(address);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Connection failed.");
    }
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.btn, status === "pending" && styles.btnPending]}
        onPress={handleConnect}
        disabled={status === "pending"}
      >
        <Text style={styles.label}>
          {status === "pending" ? "Connecting…" : "Connect MetaMask"}
        </Text>
      </Pressable>
      {status === "error" ? <Text style={styles.error}>{errorMsg}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 8 },
  btn: {
    backgroundColor: brand.gold,
    borderRadius: radii.card,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  btnPending: { opacity: 0.6 },
  label: {
    color: "#1a1210",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  error: { color: "#f87171", fontSize: 13, textAlign: "center", maxWidth: 320 },
});
