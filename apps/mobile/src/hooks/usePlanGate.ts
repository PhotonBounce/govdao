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

// Feature-specific value copy shown on the gate. A concrete benefit for the exact
// feature the member tapped converts far better than a generic "upgrade" list.
const FEATURE_BENEFITS: Record<PremiumFeature, string> = {
  "guardian-drill": "Rehearse emergency pauses on a schedule so your guardian keys are proven ready before a real incident — not during one.",
  "member-invite": "Add new members with a timelock buffer, so the whole DAO can veto a wrong address before it ever lands on-chain.",
  "activity-export": "Export every vote, proposal, and treasury movement to CSV or JSON for audits, board reports, and tax records — in one tap.",
  "delegate-analytics": "See participation rates, pass/fail ratios, quorum distance, and your top delegates across all of governance history.",
  "deploy-wizard": "Launch a fresh governance stack — MemberRegistry, Timelock, Governor, Treasury, Guardian — from one guided, wallet-signed flow.",
};

export interface PlanGateResult {
  allowed: boolean;
  feature: PremiumFeature;
  label: string;
  benefit: string;
  plan: "free" | "premium";
}

export function usePlanGate(manifest: AppManifest, feature: PremiumFeature): PlanGateResult {
  const plan = manifest.features.plan ?? "free";
  return {
    allowed: plan === "premium",
    feature,
    label: FEATURE_LABELS[feature],
    benefit: FEATURE_BENEFITS[feature],
    plan,
  };
}
