import { useState } from "react";
import {
  ProposalCreationPhase,
  ProposalCreationResult,
  ProposalDraft,
  submitProposalDraft,
  validateProposalDraft
} from "../data/proposalCreationSource";
import { SessionIdentity } from "../data/sessionSource";

const EMPTY_DRAFT: ProposalDraft = { title: "", summary: "", docUri: "", docHash: "" };

export function useProposalCreationController(identity: SessionIdentity | null) {
  const [draft, setDraft] = useState<ProposalDraft>(EMPTY_DRAFT);
  const [phase, setPhase] = useState<ProposalCreationPhase>("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<ProposalCreationResult | null>(null);

  function setField(field: keyof ProposalDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  }

  async function submit() {
    if (!identity) {
      return;
    }

    setErrors([]);
    const validationErrors = validateProposalDraft(draft);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const submittedResult = await submitProposalDraft(draft, identity, setPhase);
      setResult(submittedResult);
    } catch (err) {
      setPhase("error");
      setErrors([err instanceof Error ? err.message : "Submission failed. Please try again."]);
    }
  }

  function reset() {
    setDraft(EMPTY_DRAFT);
    setPhase("idle");
    setErrors([]);
    setResult(null);
  }

  const isSubmitting = phase === "validating" || phase === "submitting";
  const canSubmit = !isSubmitting && phase !== "submitted" && !!identity;

  return {
    draft,
    phase,
    errors,
    result,
    isSubmitting,
    canSubmit,
    setField,
    submit,
    reset
  };
}
