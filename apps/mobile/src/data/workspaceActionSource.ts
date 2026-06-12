import { AppManifest } from "../types";
import { SessionIdentity } from "./sessionSource";

export type WorkspaceAction = "request-review" | "publish" | "archive";
export type WorkspaceActionPhase = "idle" | "submitting" | "done" | "error";

export interface WorkspaceActionResult {
  action: WorkspaceAction;
  itemId: string;
  actedAt: string;
  transport: "fixture";
  message: string;
}

const ACTION_LABELS: Record<WorkspaceAction, string> = {
  "request-review": "Request Review",
  "publish": "Publish to Members",
  "archive": "Archive"
};

const ACTION_MESSAGES: Record<WorkspaceAction, string> = {
  "request-review": "Review request routed to the configured reviewer group.",
  "publish": "Document published — members can now view it in the governance feed.",
  "archive": "Item archived and removed from the active workspace queue."
};

export function formatWorkspaceAction(action: WorkspaceAction): string {
  return ACTION_LABELS[action];
}

export async function submitWorkspaceAction(
  itemId: string,
  action: WorkspaceAction,
  identity: SessionIdentity | null,
  _manifest: AppManifest,
  onPhase: (phase: WorkspaceActionPhase) => void
): Promise<WorkspaceActionResult> {
  if (!identity) {
    throw new Error("Session required to perform workspace actions.");
  }

  onPhase("submitting");
  await new Promise((r) => setTimeout(r, 30));

  onPhase("done");

  return {
    action,
    itemId,
    actedAt: new Date().toISOString(),
    transport: "fixture",
    message: ACTION_MESSAGES[action]
  };
}

export function allowedActions(itemStatus: string): WorkspaceAction[] {
  if (itemStatus === "Needs Review") return ["request-review", "archive"];
  if (itemStatus === "Ready") return ["publish", "archive"];
  if (itemStatus === "Scheduled") return ["archive"];
  return ["archive"];
}
