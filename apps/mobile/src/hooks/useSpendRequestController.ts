import { useRef, useState } from "react";
import { AppManifest } from "../types";
import { SessionIdentity } from "../data/sessionSource";
import {
  SpendRequestDraft,
  SpendRequestPhase,
  SpendRequestResult,
  submitSpendRequest,
  validateSpendRequest
} from "../data/treasuryRequestSource";

const EMPTY_DRAFT: SpendRequestDraft = {
  title: "",
  amount: "",
  recipientAddress: "",
  purpose: "",
  docUri: ""
};

export function useSpendRequestController(identity: SessionIdentity | null, manifest: AppManifest) {
  const [draft, setDraft] = useState<SpendRequestDraft>(EMPTY_DRAFT);
  const [phase, setPhase] = useState<SpendRequestPhase>("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<SpendRequestResult | null>(null);
  const requestIdRef = useRef(0);

  const isSubmitting = phase === "validating" || phase === "submitting";
  const canSubmit = !isSubmitting && phase !== "queued" &&
    draft.title.trim().length >= 6 &&
    draft.amount.trim().length > 0 &&
    draft.recipientAddress.trim().length > 0 &&
    draft.purpose.trim().length >= 20;

  function setField<K extends keyof SpendRequestDraft>(key: K, value: SpendRequestDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    const myId = ++requestIdRef.current;

    const validationErrors = validateSpendRequest(draft);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);

    try {
      const outcome = await submitSpendRequest(draft, identity, manifest, (p) => {
        if (requestIdRef.current === myId) setPhase(p);
      });
      if (requestIdRef.current === myId) setResult(outcome);
    } catch (err) {
      if (requestIdRef.current === myId) {
        setPhase("error");
        setErrors([err instanceof Error ? err.message : "Submission failed."]);
      }
    }
  }

  function reset() {
    setDraft(EMPTY_DRAFT);
    setPhase("idle");
    setErrors([]);
    setResult(null);
  }

  return { draft, phase, errors, result, isSubmitting, canSubmit, setField, submit, reset };
}
