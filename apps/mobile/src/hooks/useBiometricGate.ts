import { AppManifest } from "../types";
import { BiometricAction, BiometricStatus, WEB_BIOMETRIC_STATUS } from "../data/biometricConfig";

export interface BiometricGate {
  status: BiometricStatus;
  confirm: (action: BiometricAction) => Promise<boolean>;
}

// Web / default: no native biometric hardware, so confirmation never blocks actions.
// The expo-local-authentication SDK is imported only by useBiometricGate.native.ts.
export function useBiometricGate(_manifest: AppManifest): BiometricGate {
  return { status: WEB_BIOMETRIC_STATUS, confirm: async () => true };
}
