import { AppManifest } from "../types";
import { SessionIdentity } from "./sessionSource";

export type InvitePhase = "idle" | "validating" | "submitting" | "pending" | "error";

export interface InviteDraft {
  address: string;
  role: string;
  displayName: string;
}

export interface InviteReceipt {
  inviteId: string;
  address: string;
  role: string;
  displayName: string;
  timelockLabel: string;
  transport: "fixture";
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

const PREDEFINED_ROLES = [
  "Delegate",
  "Guardian Delegate",
  "Treasury Steward",
  "Protocol Operator",
  "Community Lead"
];

export const INVITE_ROLES = PREDEFINED_ROLES;

export function validateInviteDraft(draft: InviteDraft): string[] {
  const errors: string[] = [];

  if (!ADDRESS_RE.test(draft.address.trim())) {
    errors.push("Address must be a valid Ethereum address (0x…40 hex chars).");
  }

  if (!draft.role.trim() || draft.role.trim().length < 4) {
    errors.push("Role must be at least 4 characters.");
  }

  if (!draft.displayName.trim() || draft.displayName.trim().length < 3) {
    errors.push("Display name must be at least 3 characters.");
  }

  return errors;
}

function buildInviteId(): string {
  return `MBR-${String(5 + Math.floor(Math.random() * 95)).padStart(3, "0")}`;
}

export async function submitMemberInvite(
  draft: InviteDraft,
  identity: SessionIdentity | null,
  _manifest: AppManifest,
  onPhase: (phase: InvitePhase) => void
): Promise<InviteReceipt> {
  onPhase("validating");

  const errors = validateInviteDraft(draft);
  if (errors.length > 0) {
    onPhase("error");
    throw new Error(errors[0]);
  }

  if (!identity) {
    onPhase("error");
    throw new Error("Active member session required to submit an invitation.");
  }

  await new Promise((r) => setTimeout(r, 20));
  onPhase("submitting");
  await new Promise((r) => setTimeout(r, 20));
  onPhase("pending");

  return {
    inviteId: buildInviteId(),
    address: draft.address.trim(),
    role: draft.role.trim(),
    displayName: draft.displayName.trim(),
    timelockLabel: "Pending registry confirmation — 24h timelock",
    transport: "fixture"
  };
}
