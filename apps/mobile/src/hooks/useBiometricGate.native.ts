import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { AppManifest } from "../types";
import {
  BiometricAction,
  BiometricStatus,
  WEB_BIOMETRIC_STATUS,
  biometricRequired,
  biometricPromptReason,
} from "../data/biometricConfig";

export interface BiometricGate {
  status: BiometricStatus;
  confirm: (action: BiometricAction) => Promise<boolean>;
}

export function useBiometricGate(manifest: AppManifest): BiometricGate {
  const required = biometricRequired(manifest);
  const [status, setStatus] = useState<BiometricStatus>({
    available: false,
    enrolled: false,
    required,
    detail: "Checking biometric hardware…",
  });

  useEffect(() => {
    if (Platform.OS === "web") {
      setStatus(WEB_BIOMETRIC_STATUS);
      return;
    }
    let active = true;
    (async () => {
      try {
        const available = await LocalAuthentication.hasHardwareAsync();
        const enrolled = available ? await LocalAuthentication.isEnrolledAsync() : false;
        if (active) setStatus({ available, enrolled, required, detail: "" });
      } catch {
        if (active) setStatus({ available: false, enrolled: false, required, detail: "Could not query biometric hardware." });
      }
    })();
    return () => {
      active = false;
    };
  }, [required]);

  const confirm = useCallback(
    async (action: BiometricAction): Promise<boolean> => {
      // Not required, or on web → never block.
      if (!required || Platform.OS === "web") return true;
      try {
        const available = await LocalAuthentication.hasHardwareAsync();
        const enrolled = available ? await LocalAuthentication.isEnrolledAsync() : false;
        // Can't enforce what the device can't do — allow rather than lock the user out.
        if (!available || !enrolled) return true;
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: biometricPromptReason(action),
          disableDeviceFallback: false,
        });
        return result.success;
      } catch {
        return false;
      }
    },
    [required]
  );

  return { status, confirm };
}
