import { AppManifest } from "../types";

export type PremiumFeature =
  | "guardian-drill"
  | "member-invite"
  | "activity-export"
  | "delegate-analytics"
  | "deploy-wizard";

const FEATURE_LABELS: Record<PremiumFeature, string> = {
  "guardian-drill": "Guardian Drill Scheduling",
  "member-invite": "Member Invite",
  "activity-export": "Activity Export",
  "delegate-analytics": "Delegate Analytics",
  "deploy-wizard": "Contract Deploy Wizard",
};

export interface PlanGateResult {
  allowed: boolean;
  feature: PremiumFeature;
  label: string;
  plan: "free" | "premium";
}

export function usePlanGate(manifest: AppManifest, feature: PremiumFeature, premiumActive?: boolean): PlanGateResult {
  const plan = (manifest.features.plan === "premium" || premiumActive === true) ? "premium" : "free";
  return {
    allowed: plan === "premium",
    feature,
    label: FEATURE_LABELS[feature],
    plan,
  };
}
