import { useRef, useState } from "react";
import { AppManifest } from "../types";
import { SessionIdentity } from "../data/sessionSource";
import {
  InviteDraft,
  InvitePhase,
  InviteReceipt,
  submitMemberInvite,
  validateInviteDraft
} from "../data/memberInviteSource";

const DEFAULT_DRAFT: InviteDraft = {
  address: "",
  role: "",
  displayName: ""
};

export function useMemberInviteController(identity: SessionIdentity | null, manifest: AppManifest) {
  const [draft, setDraft] = useState<InviteDraft>(DEFAULT_DRAFT);
  const [phase, setPhase] = useState<InvitePhase>("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<InviteReceipt | null>(null);
  const requestIdRef = useRef(0);

  const isSubmitting = phase === "validating" || phase === "submitting";
  const canSubmit = !isSubmitting && phase !== "pending" &&
    draft.address.trim().length > 0 &&
    draft.role.trim().length >= 4 &&
    draft.displayName.trim().length >= 3;

  function setField<K extends keyof InviteDraft>(key: K, value: InviteDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    const myId = ++requestIdRef.current;

    const validationErrors = validateInviteDraft(draft);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);

    try {
      const receipt = await submitMemberInvite(draft, identity, manifest, (p) => {
        if (requestIdRef.current === myId) setPhase(p);
      });
      if (requestIdRef.current === myId) setResult(receipt);
    } catch (err) {
      if (requestIdRef.current === myId) {
        setPhase("error");
        setErrors([err instanceof Error ? err.message : "Submission failed."]);
      }
    }
  }

  function reset() {
    setDraft(DEFAULT_DRAFT);
    setPhase("idle");
    setErrors([]);
    setResult(null);
  }

  return { draft, phase, errors, result, isSubmitting, canSubmit, setField, submit, reset };
}
