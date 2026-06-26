import { isPlaceholder } from "../shell/mobileShellUtils";
import { AppManifest } from "../types";

export interface LiveContract {
  label: string;
  address: string;
}

export const CONTRACT_ORDER: { key: keyof AppManifest["contracts"]; label: string }[] = [
  { key: "governor", label: "Governor" },
  { key: "treasury", label: "Treasury" },
  { key: "memberRegistry", label: "Member Registry" },
  { key: "timelock", label: "Timelock" },
  { key: "emergencyGuardian", label: "Emergency Guardian" },
];

/**
 * Pure selector for the genuinely-deployed contracts. Kept free of React/React
 * Native imports so the trust-badge gating ("never show placeholder addresses")
 * is unit-testable in a plain Node QA gate.
 */
export function liveContracts(manifest: AppManifest): LiveContract[] {
  return CONTRACT_ORDER.map(({ key, label }) => ({
    label,
    address: manifest.contracts[key],
  })).filter(
    (c): c is LiveContract =>
      typeof c.address === "string" && c.address.length > 0 && !isPlaceholder(c.address)
  );
}
