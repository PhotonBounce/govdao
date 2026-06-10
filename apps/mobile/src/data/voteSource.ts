import { SessionIdentity } from "./sessionSource";

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
  onPhase?: (phase: VotePhase) => void
): Promise<VoteReceipt> {
  // Until on-chain submission lands, votes settle against a fixture transaction
  // path with the same signing/pending phases a real wallet flow would surface.
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
