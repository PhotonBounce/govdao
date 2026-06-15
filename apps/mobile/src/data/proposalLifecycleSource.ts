import { AppManifest } from "../types";
import { isFixtureMode, getActiveSigner, buildContract } from "./walletProvider";
import { GOVERNOR_ABI } from "./contractAbis";

export type LifecycleAction = "queue" | "execute";
export type LifecyclePhase = "signing" | "pending";

export interface LifecycleReceipt {
  proposalId: string;
  action: LifecycleAction;
  txHash: string;
  transport: "fixture" | "remote";
  submittedAt: string;
}

const SIGNING_DELAY_MS = 250;
const CONFIRM_DELAY_MS = 400;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fixtureTxHash(seed: string): string {
  let acc = 11;
  for (let i = 0; i < seed.length; i += 1) acc = (acc * 33 + seed.charCodeAt(i)) >>> 0;
  let hex = "";
  while (hex.length < 64) {
    acc = (acc * 1103515245 + 12345) >>> 0;
    hex += acc.toString(16).padStart(8, "0");
  }
  return `0x${hex.slice(0, 64)}`;
}

async function runLifecycle(
  action: LifecycleAction,
  proposalId: string,
  manifest: AppManifest,
  onPhase?: (phase: LifecyclePhase) => void
): Promise<LifecycleReceipt> {
  const submittedAt = new Date().toISOString();

  if (!isFixtureMode(manifest)) {
    const signer = getActiveSigner();
    if (signer) {
      try {
        onPhase?.("signing");
        const governor = buildContract(manifest.contracts.governor, GOVERNOR_ABI, signer);
        const tx = action === "queue" ? await governor.queue(proposalId) : await governor.execute(proposalId);
        onPhase?.("pending");
        const receipt = await tx.wait();
        return { proposalId, action, txHash: receipt?.hash ?? tx.hash, transport: "remote", submittedAt };
      } catch (err) {
        throw err instanceof Error ? err : new Error(`On-chain ${action} transaction failed.`);
      }
    }
  }

  onPhase?.("signing");
  await wait(SIGNING_DELAY_MS);
  onPhase?.("pending");
  await wait(CONFIRM_DELAY_MS);
  return { proposalId, action, txHash: fixtureTxHash(`${action}:${proposalId}`), transport: "fixture", submittedAt };
}

/** Queue a Succeeded proposal — moves its actions into the timelock. */
export function queueProposal(
  proposalId: string,
  manifest: AppManifest,
  onPhase?: (phase: LifecyclePhase) => void
): Promise<LifecycleReceipt> {
  return runLifecycle("queue", proposalId, manifest, onPhase);
}

/** Execute a Queued proposal — runs its timelocked actions once the delay has elapsed. */
export function executeProposal(
  proposalId: string,
  manifest: AppManifest,
  onPhase?: (phase: LifecyclePhase) => void
): Promise<LifecycleReceipt> {
  return runLifecycle("execute", proposalId, manifest, onPhase);
}

/** Which lifecycle action (if any) is available for a proposal in the given state. */
export function nextLifecycleAction(stateLabel: string): LifecycleAction | null {
  if (stateLabel === "Succeeded") return "queue";
  if (stateLabel === "Queued") return "execute";
  return null;
}
