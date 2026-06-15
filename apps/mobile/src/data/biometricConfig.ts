import { AppManifest } from "../types";

export type BiometricAction = "queue" | "execute" | "vote" | "propose";

export interface BiometricStatus {
  available: boolean; // hardware present
  enrolled: boolean; // user has enrolled biometrics
  required: boolean; // manifest requires confirmation before signing
  detail: string;
}

export const WEB_BIOMETRIC_STATUS: BiometricStatus = {
  available: false,
  enrolled: false,
  required: false,
  detail: "Biometric confirmation is available on native device builds.",
};

/** Whether the manifest asks for a biometric confirmation before on-chain signing. */
export function biometricRequired(manifest: AppManifest): boolean {
  return manifest.features?.biometricConfirm === true;
}

export function biometricPromptReason(action: BiometricAction): string {
  switch (action) {
    case "vote":
      return "Confirm to cast your on-chain vote";
    case "propose":
      return "Confirm to submit your proposal";
    case "queue":
      return "Confirm to queue this proposal for the timelock";
    case "execute":
      return "Confirm to execute this proposal";
  }
}

export function describeBiometricStatus(status: BiometricStatus): string {
  if (!status.required) {
    return "Optional — enable biometricConfirm in the manifest to require it before signing.";
  }
  if (!status.available) {
    return "Required, but this device has no biometric hardware.";
  }
  if (!status.enrolled) {
    return "Required, but no biometrics are enrolled. Add a fingerprint or Face ID in system settings.";
  }
  return "On — you'll confirm with biometrics before each on-chain action.";
}
