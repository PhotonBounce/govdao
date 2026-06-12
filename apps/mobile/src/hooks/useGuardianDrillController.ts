import { useRef, useState } from "react";
import { AppManifest } from "../types";
import { SessionIdentity } from "../data/sessionSource";
import {
  DrillDraft,
  DrillPhase,
  DrillReceipt,
  DrillType,
  scheduleDrill,
  validateDrillDraft
} from "../data/guardianDrillSource";

const DEFAULT_DRAFT: DrillDraft = {
  drillType: "pause",
  scheduledWindowHours: 2,
  notesForSigners: ""
};

export function useGuardianDrillController(identity: SessionIdentity | null, manifest: AppManifest) {
  const [draft, setDraft] = useState<DrillDraft>(DEFAULT_DRAFT);
  const [phase, setPhase] = useState<DrillPhase>("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<DrillReceipt | null>(null);
  const requestIdRef = useRef(0);

  const isSubmitting = phase === "validating" || phase === "scheduling";
  const canSubmit = !isSubmitting && phase !== "scheduled" &&
    draft.notesForSigners.trim().length >= 10 &&
    draft.scheduledWindowHours >= 1;

  function setDrillType(drillType: DrillType) {
    setDraft((prev) => ({ ...prev, drillType }));
  }

  function setWindowHours(scheduledWindowHours: number) {
    setDraft((prev) => ({ ...prev, scheduledWindowHours }));
  }

  function setNotes(notesForSigners: string) {
    setDraft((prev) => ({ ...prev, notesForSigners }));
  }

  async function submit() {
    const myId = ++requestIdRef.current;

    const validationErrors = validateDrillDraft(draft);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);

    try {
      const outcome = await scheduleDrill(draft, identity, manifest, (p) => {
        if (requestIdRef.current === myId) setPhase(p);
      });
      if (requestIdRef.current === myId) setResult(outcome);
    } catch (err) {
      if (requestIdRef.current === myId) {
        setPhase("error");
        setErrors([err instanceof Error ? err.message : "Scheduling failed."]);
      }
    }
  }

  function reset() {
    setDraft(DEFAULT_DRAFT);
    setPhase("idle");
    setErrors([]);
    setResult(null);
  }

  return { draft, phase, errors, result, isSubmitting, canSubmit, setDrillType, setWindowHours, setNotes, submit, reset };
}
