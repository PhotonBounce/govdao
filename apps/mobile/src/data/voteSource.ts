import { AppManifest } from "../types";
import { SessionIdentity } from "./sessionSource";
import { isFixtureMode, getActiveSigner, buildContract } from "./walletProvider";
import { GOVERNOR_ABI, VOTE_SUPPORT } from "./contractAbis";

export type VoteChoice = "for" | "against" | "abstain";
export type VotePhase = "signing" | "pending";

export interface VoteReceipt {
  proposalId: string;
  choice: VoteChoice;
  voter: string;
  voterLabel: string;
  txHash: string;
  transport: "fixture" | "remote";
  submittedAt: string;
  confirmedAt: string;
}

const SIGNING_DELAY_MS = 300;
const CONFIRMATION_DELAY_MS = 500;

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

function getTimestamp(): string {
  return new Date().toISOString();
}

// Deterministic pseudo-hash so fixture receipts are stable and obviously synthetic.
function buildFixtureTxHash(seed: string): string {
  let acc = 7;
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

export async function castVoteTransaction(
  proposalId: string,
  choice: VoteChoice,
  identity: SessionIdentity,
  manifest: AppManifest,
  onPhase?: (phase: VotePhase) => void
): Promise<VoteReceipt> {
  if (!isFixtureMode(manifest)) {
    const signer = getActiveSigner();
    if (signer) {
      try {
        onPhase?.("signing");
        const governor = buildContract(manifest.contracts.governor, GOVERNOR_ABI, signer);
        const support = VOTE_SUPPORT[choice];
        const tx = await governor.castVote(proposalId, support);
        const submittedAt = getTimestamp();
        onPhase?.("pending");
        const receipt = await tx.wait();
        return {
          proposalId,
          choice,
          voter: identity.address,
          voterLabel: identity.memberLabel,
          txHash: receipt?.hash ?? tx.hash,
          transport: "remote",
          submittedAt,
          confirmedAt: getTimestamp()
        };
      } catch (err) {
        throw err instanceof Error ? err : new Error("On-chain vote transaction failed.");
      }
    }
  }

  onPhase?.("signing");
  await wait(SIGNING_DELAY_MS);
  const submittedAt = getTimestamp();
  onPhase?.("pending");
  await wait(CONFIRMATION_DELAY_MS);

  return {
    proposalId,
    choice,
    voter: identity.address,
    voterLabel: identity.memberLabel,
    txHash: buildFixtureTxHash(`${proposalId}:${choice}:${identity.address}`),
    transport: "fixture",
    submittedAt,
    confirmedAt: getTimestamp()
  };
}

export function formatVoteChoice(choice: VoteChoice): string {
  return choice.charAt(0).toUpperCase() + choice.slice(1);
}
