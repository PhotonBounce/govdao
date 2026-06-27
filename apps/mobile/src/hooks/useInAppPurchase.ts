import { useCallback, useEffect, useState } from "react";
import { AppManifest } from "../types";
import { IapState } from "../data/iapConfig";
import { isFixtureMode, getActiveSigner } from "../data/walletProvider";
import { ethers } from "ethers";

export interface IapController {
  state: IapState;
  purchase: () => Promise<void>;
  restore: () => void;
}

const LOCAL_STORAGE_KEY = "govdao_premium_active";

export function useInAppPurchase(manifest: AppManifest): IapController {
  const [state, setState] = useState<IapState>({
    status: "ready",
    premium: false,
    detail: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = window.localStorage.getItem(LOCAL_STORAGE_KEY) === "true";
      if (active) {
        setState({
          status: "purchased",
          premium: true,
          detail: "Premium active — thanks for supporting GOVDAO. Ads are off and every feature is unlocked.",
        });
      } else {
        setState({
          status: "ready",
          premium: false,
          detail: "Upgrade to Premium to remove ads and unlock analytics, the deploy wizard, guardian drills and export.",
        });
      }
    }
  }, []);

  const purchase = useCallback(async () => {
    try {
      if (isFixtureMode(manifest)) {
        setState((s) => ({
          ...s,
          status: "ready",
          detail: "Processing payment via simulated wallet... Please wait.",
        }));
        // Simulate a delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        if (typeof window !== "undefined") {
          window.localStorage.setItem(LOCAL_STORAGE_KEY, "true");
        }
        setState({
          status: "purchased",
          premium: true,
          detail: "Premium active — thanks for supporting GOVDAO. Ads are off and every feature is unlocked.",
        });
        return;
      }

      const signer = getActiveSigner();
      if (!signer) {
        setState((s) => ({
          ...s,
          status: "error",
          detail: "Please connect your Web3 wallet first.",
        }));
        return;
      }

      setState((s) => ({
        ...s,
        status: "ready",
        detail: "Please confirm the 0.005 ETH premium payment in your wallet...",
      }));

      const recipient = manifest.contracts.treasury;
      if (!recipient || recipient === "0x0000000000000000000000000000000000000000") {
        setState((s) => ({
          ...s,
          status: "error",
          detail: "Error: Treasury contract address not configured in manifest.",
        }));
        return;
      }

      const tx = await signer.sendTransaction({
        to: recipient,
        value: ethers.parseEther("0.005"),
      });

      setState((s) => ({
        ...s,
        status: "ready",
        detail: "Transaction submitted. Awaiting blockchain confirmation...",
      }));

      await tx.wait();

      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, "true");
      }
      setState({
        status: "purchased",
        premium: true,
        detail: "Premium active — thanks for supporting GOVDAO. Ads are off and every feature is unlocked.",
      });
    } catch (err: any) {
      console.error("Crypto payment failed:", err);
      setState((s) => ({
        ...s,
        status: "error",
        detail: err?.message || "Transaction failed or was rejected.",
      }));
    }
  }, [manifest]);

  const restore = useCallback(() => {
    if (typeof window !== "undefined") {
      const active = window.localStorage.getItem(LOCAL_STORAGE_KEY) === "true";
      if (active) {
        setState({
          status: "purchased",
          premium: true,
          detail: "Premium active — thanks for supporting GOVDAO. Ads are off and every feature is unlocked.",
        });
      } else {
        setState((s) => ({
          ...s,
          status: "ready",
          detail: "No previous purchase found in browser storage.",
        }));
      }
    }
  }, []);

  return { state, purchase, restore };
}
