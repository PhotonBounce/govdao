import { AppManifest } from "../types";
import { SessionIdentity } from "./sessionSource";

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
  transport: "fixture";
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

export async function scheduleDrill(
  draft: DrillDraft,
  identity: SessionIdentity | null,
  _manifest: AppManifest,
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
