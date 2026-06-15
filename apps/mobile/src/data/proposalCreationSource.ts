import { ethers } from "ethers";
import { AppManifest } from "../types";
import { SessionIdentity } from "./sessionSource";
import { isFixtureMode, getActiveSigner, buildContract } from "./walletProvider";
import { GOVERNOR_ABI } from "./contractAbis";

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
  manifest: AppManifest,
  onPhase: (phase: ProposalCreationPhase) => void
): Promise<ProposalCreationResult> {
  onPhase("validating");

  const errors = validateProposalDraft(draft);
  if (errors.length > 0) {
    onPhase("error");
    throw new Error(errors[0]);
  }

  if (!isFixtureMode(manifest)) {
    const signer = getActiveSigner();
    if (signer) {
      try {
        onPhase("submitting");
        const governor = buildContract(manifest.contracts.governor, GOVERNOR_ABI, signer);

        // The Governor requires non-empty metadata and at least one target. A
        // signalling proposal targets the Governor itself with empty calldata —
        // valid at propose time, a no-op if ever executed.
        const metadataURI = draft.docUri.trim() || `govdao://proposal/${encodeURIComponent(draft.title.trim())}`;
        const metadataHash = draft.docHash.trim() && DOC_HASH_PATTERN.test(draft.docHash.trim())
          ? draft.docHash.trim()
          : ethers.keccak256(ethers.toUtf8Bytes(`${draft.title}\n${draft.summary}\n${metadataURI}`));
        const targets = [manifest.contracts.governor];
        const values = [0n];
        const calldatas = ["0x"];

        const tx = await governor.propose(targets, values, calldatas, metadataURI, metadataHash);
        const receipt = await tx.wait();

        // Pull the numeric proposalId from the ProposalCreated event.
        let proposalId = "";
        for (const log of receipt?.logs ?? []) {
          try {
            const parsed = governor.interface.parseLog({ topics: [...log.topics], data: log.data });
            if (parsed?.name === "ProposalCreated") {
              proposalId = String(parsed.args.proposalId);
              break;
            }
          } catch {
            // not a Governor event — skip
          }
        }
        if (!proposalId) {
          proposalId = String(await governor.proposalCount());
        }

        onPhase("submitted");
        return {
          proposalId,
          txHash: receipt?.hash ?? tx.hash
        };
      } catch (err) {
        onPhase("error");
        throw err instanceof Error ? err : new Error("On-chain proposal submission failed.");
      }
    }
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
