import { AppManifest } from "../types";
import { SessionIdentity } from "./sessionSource";
import { isFixtureMode, getActiveSigner, buildContract } from "./walletProvider";
import { EMERGENCY_GUARDIAN_ABI } from "./contractAbis";

export type DrillType = "pause" | "resume" | "full-cycle";
export type DrillPhase = "idle" | "validating" | "scheduling" | "scheduled" | "error";

export interface DrillDraft {
  drillType: DrillType;
  scheduledWindowHours: number;
  notesForSigners: string;
}

export interface DrillReceipt {
  drillId: string;
  drillType: DrillType;
  scheduledAt: string;
  windowLabel: string;
  requiredSigners: number;
  transport: "fixture" | "remote";
}

const DRILL_TYPE_LABELS: Record<DrillType, string> = {
  "pause": "Pause Drill",
  "resume": "Resume Drill",
  "full-cycle": "Full Pause/Resume Cycle"
};

export function formatDrillType(drillType: DrillType): string {
  return DRILL_TYPE_LABELS[drillType];
}

export function validateDrillDraft(draft: DrillDraft): string[] {
  const errors: string[] = [];

  if (!draft.drillType) {
    errors.push("Drill type is required.");
  }

  if (!draft.scheduledWindowHours || draft.scheduledWindowHours < 1 || draft.scheduledWindowHours > 72) {
    errors.push("Window must be between 1 and 72 hours.");
  }

  if (!draft.notesForSigners.trim() || draft.notesForSigners.trim().length < 10) {
    errors.push("Notes for signers must be at least 10 characters.");
  }

  return errors;
}

function buildDrillId(): string {
  return `GRD-${20 + Math.floor(Math.random() * 80)}`;
}

const DRILL_TYPE_ENUM: Record<DrillType, number> = { pause: 0, resume: 1, "full-cycle": 2 };

export async function scheduleDrill(
  draft: DrillDraft,
  identity: SessionIdentity | null,
  manifest: AppManifest,
  onPhase: (phase: DrillPhase) => void
): Promise<DrillReceipt> {
  onPhase("validating");

  const errors = validateDrillDraft(draft);
  if (errors.length > 0) {
    onPhase("error");
    throw new Error(errors[0]);
  }

  if (!identity) {
    onPhase("error");
    throw new Error("Active member session required to schedule a guardian drill.");
  }

  if (!isFixtureMode(manifest)) {
    const signer = getActiveSigner();
    if (signer) {
      try {
        onPhase("scheduling");
        const guardian = buildContract(manifest.contracts.emergencyGuardian, EMERGENCY_GUARDIAN_ABI, signer);
        const tx = await guardian.scheduleDrill(DRILL_TYPE_ENUM[draft.drillType], draft.scheduledWindowHours);
        const receipt = await tx.wait();
        onPhase("scheduled");
        return {
          drillId: `GRD-${(receipt?.blockNumber ?? 0) % 80 + 20}`,
          drillType: draft.drillType,
          scheduledAt: new Date().toISOString(),
          windowLabel: `${draft.scheduledWindowHours}h window`,
          requiredSigners: 3,
          transport: "remote"
        };
      } catch (err) {
        onPhase("error");
        throw err instanceof Error ? err : new Error("On-chain drill scheduling failed.");
      }
    }
  }

  await new Promise((r) => setTimeout(r, 20));
  onPhase("scheduling");
  await new Promise((r) => setTimeout(r, 20));
  onPhase("scheduled");

  return {
    drillId: buildDrillId(),
    drillType: draft.drillType,
    scheduledAt: new Date().toISOString(),
    windowLabel: `${draft.scheduledWindowHours}h window`,
    requiredSigners: 3,
    transport: "fixture"
  };
}
