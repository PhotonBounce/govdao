import { AppManifest } from "../types";
import { SessionIdentity } from "./sessionSource";
import { isFixtureMode, getActiveSigner, buildContract } from "./walletProvider";
import { GOVERNOR_ABI, TREASURY_ABI } from "./contractAbis";
import { ethers } from "ethers";

export interface SpendRequestDraft {
  title: string;
  amount: string;
  recipientAddress: string;
  purpose: string;
  docUri?: string;
}

export type SpendRequestPhase = "idle" | "validating" | "submitting" | "queued" | "error";

export interface SpendRequestResult {
  requestId: string;
  txHash: string;
  timelockEtaLabel: string;
  timelockSeconds: number;
  transport: "fixture" | "remote";
}

const ETH_AMOUNT_RE = /^\d+(\.\d{1,18})?$/;
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const DOC_URI_RE = /^(https?:\/\/|fixture:\/\/|ipfs:\/\/)/;

export function validateSpendRequest(draft: SpendRequestDraft): string[] {
  const errors: string[] = [];

  if (!draft.title.trim() || draft.title.trim().length < 6) {
    errors.push("Title must be at least 6 characters.");
  }

  if (!draft.amount.trim() || !ETH_AMOUNT_RE.test(draft.amount.trim())) {
    errors.push("Amount must be a valid ETH number (e.g. 1.5 or 10).");
  } else {
    const parsed = parseFloat(draft.amount);
    if (parsed <= 0) errors.push("Amount must be greater than zero.");
    if (parsed > 25) errors.push("Amount exceeds the per-transfer cap of 25 ETH.");
  }

  if (!draft.recipientAddress.trim() || !ADDRESS_RE.test(draft.recipientAddress.trim())) {
    errors.push("Recipient must be a valid Ethereum address (0x…40 hex chars).");
  }

  if (!draft.purpose.trim() || draft.purpose.trim().length < 20) {
    errors.push("Purpose must be at least 20 characters.");
  }

  if (draft.docUri && !DOC_URI_RE.test(draft.docUri.trim())) {
    errors.push("Doc URI must start with https://, fixture://, or ipfs://.");
  }

  return errors;
}

function buildRequestId(): string {
  const n = 100 + Math.floor(Math.random() * 900);
  return `TRX-${n}`;
}

function buildFixtureTxHash(requestId: string): string {
  const idPart = requestId.replace(/[^0-9]/g, "").padStart(6, "0");
  const timePart = Date.now().toString(16).slice(-12).padStart(12, "0");
  return `0x${idPart}${timePart}${"0".repeat(46)}`;
}

export async function submitSpendRequest(
  draft: SpendRequestDraft,
  identity: SessionIdentity | null,
  manifest: AppManifest,
  onPhase: (phase: SpendRequestPhase) => void
): Promise<SpendRequestResult> {
  onPhase("validating");

  const errors = validateSpendRequest(draft);
  if (errors.length > 0) {
    onPhase("error");
    throw new Error(errors[0]);
  }

  if (!identity) {
    onPhase("error");
    throw new Error("Session required to submit treasury spend requests.");
  }

  if (!isFixtureMode(manifest)) {
    const signer = getActiveSigner();
    if (signer) {
      try {
        onPhase("submitting");
        // Treasury spends are enacted through governance: create a proposal whose
        // executable action calls treasury.transferETH(recipient, amount). After it
        // passes a vote and clears the timelock it can be queued and executed.
        const governor = buildContract(manifest.contracts.governor, GOVERNOR_ABI, signer);
        const treasuryIface = new ethers.Interface([...TREASURY_ABI]);
        const calldata = treasuryIface.encodeFunctionData("transferETH", [
          draft.recipientAddress.trim(),
          ethers.parseEther(draft.amount)
        ]);
        const metadataURI = draft.docUri?.trim() || `govdao://spend/${encodeURIComponent(draft.title.trim())}`;
        const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(`${draft.title}\n${draft.purpose}\n${draft.amount}`));

        const tx = await governor.propose([manifest.contracts.treasury], [0n], [calldata], metadataURI, metadataHash);
        const receipt = await tx.wait();

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
        if (!proposalId) proposalId = String(await governor.proposalCount());

        onPhase("queued");
        return {
          requestId: `GOV-${proposalId}`,
          txHash: receipt?.hash ?? tx.hash,
          timelockEtaLabel: "Governance vote, then timelock",
          timelockSeconds: 86400,
          transport: "remote"
        };
      } catch (err) {
        onPhase("error");
        throw err instanceof Error ? err : new Error("On-chain spend request failed.");
      }
    }
  }

  await new Promise((r) => setTimeout(r, 20));
  onPhase("submitting");
  await new Promise((r) => setTimeout(r, 20));
  onPhase("queued");

  const requestId = buildRequestId();

  return {
    requestId,
    txHash: buildFixtureTxHash(requestId),
    timelockEtaLabel: "Timelock: 24h",
    timelockSeconds: 86400,
    transport: "fixture"
  };
}
