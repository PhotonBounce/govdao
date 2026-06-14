import { SessionIdentity } from "./sessionSource";

export type MotionDecision = "approve" | "return";
export type MotionActionPhase = "reviewing" | "recording";

export interface MotionDecisionReceipt {
  motionId: string;
  decision: MotionDecision;
  reviewer: string;
  reviewerLabel: string;
  anchorHash: string;
  anchored: boolean;
  transport: "fixture" | "remote";
  recordedAt: string;
}

const REVIEW_DELAY_MS = 300;
const RECORD_DELAY_MS = 500;

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

// Deterministic pseudo-hash so fixture receipts are stable and obviously synthetic.
function buildFixtureAnchorHash(seed: string): string {
  let acc = 11;
  for (let index = 0; index < seed.length; index += 1) {
    acc = (acc * 31 + seed.charCodeAt(index)) >>> 0;
  }

  let hex = "";
  while (hex.length < 64) {
    acc = (acc * 1103515245 + 12345) >>> 0;
    hex += acc.toString(16).padStart(8, "0");
  }

  return `0x${hex.slice(0, 64)}`;
}

export async function submitMotionDecision(
  motionId: string,
  decision: MotionDecision,
  identity: SessionIdentity,
  anchoringEnabled: boolean,
  onPhase?: (phase: MotionActionPhase) => void
): Promise<MotionDecisionReceipt> {
  // Until the off-chain control plane is wired, decisions settle against a
  // fixture path with the same reviewing/recording phases a live API would surface.
  onPhase?.("reviewing");
  await wait(REVIEW_DELAY_MS);
  onPhase?.("recording");
  await wait(RECORD_DELAY_MS);

  return {
    motionId,
    decision,
    reviewer: identity.address,
    reviewerLabel: identity.memberLabel,
    anchorHash: buildFixtureAnchorHash(`${motionId}:${decision}:${identity.address}`),
    anchored: anchoringEnabled,
    transport: "fixture",
    recordedAt: new Date().toISOString()
  };
}

export function formatMotionDecision(decision: MotionDecision): string {
  return decision === "approve" ? "Approve" : "Return For Revision";
}
