import { SessionIdentity } from "./sessionSource";

export type ProposalCreationPhase = "idle" | "validating" | "submitting" | "submitted" | "error";

export interface ProposalDraft {
  title: string;
  summary: string;
  docUri: string;
  docHash: string;
}

export interface ProposalCreationResult {
  proposalId: string;
  txHash: string;
}

const DOC_URI_PATTERN = /^(https:\/\/|fixture:\/\/)/;
const DOC_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;

export function validateProposalDraft(draft: ProposalDraft): string[] {
  const errors: string[] = [];

  if (!draft.title.trim()) {
    errors.push("Title is required.");
  } else if (draft.title.trim().length < 8) {
    errors.push("Title must be at least 8 characters.");
  }

  if (!draft.summary.trim()) {
    errors.push("Summary is required.");
  } else if (draft.summary.trim().length < 20) {
    errors.push("Summary must be at least 20 characters.");
  }

  if (draft.docUri.trim() && !DOC_URI_PATTERN.test(draft.docUri.trim())) {
    errors.push("Document URI must start with https://.");
  }

  if (draft.docHash.trim() && !DOC_HASH_PATTERN.test(draft.docHash.trim())) {
    errors.push("Document hash must be a valid 0x-prefixed keccak-256 hex string (66 chars).");
  }

  return errors;
}

function buildFixtureTxHash(address: string): string {
  const addrPart = address.replace(/^0x/i, "").slice(0, 8).toLowerCase();
  const timePart = Date.now().toString(16).padStart(12, "0").slice(-12);
  return `0x${addrPart}${timePart}${"0".repeat(44)}`.slice(0, 66);
}

export async function submitProposalDraft(
  draft: ProposalDraft,
  identity: SessionIdentity,
  onPhase: (phase: ProposalCreationPhase) => void
): Promise<ProposalCreationResult> {
  onPhase("validating");

  const errors = validateProposalDraft(draft);
  if (errors.length > 0) {
    onPhase("error");
    throw new Error(errors[0]);
  }

  await new Promise<void>((resolve) => setTimeout(resolve, 500));
  onPhase("submitting");

  await new Promise<void>((resolve) => setTimeout(resolve, 900));

  const fixtureIndex = 300 + Math.floor(Math.random() * 600);
  onPhase("submitted");

  return {
    proposalId: `GOV-${fixtureIndex}`,
    txHash: buildFixtureTxHash(identity.address)
  };
}
