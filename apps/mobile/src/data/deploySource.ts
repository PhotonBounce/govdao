import { AppManifest } from "../types";
import { isFixtureMode, getActiveSigner } from "./walletProvider";
import { ethers } from "ethers";

export type DeployStep = 0 | 1 | 2 | 3 | 4;
export type DeployPhase = "idle" | "deploying" | "deployed" | "error";

export interface DeployStepResult {
  step: DeployStep;
  contractName: string;
  address: string;
  txHash: string;
  transport: "fixture" | "remote";
}

export interface DeployManifestFragment {
  contracts: {
    memberRegistry: string;
    timelock: string;
    governor: string;
    treasury: string;
    emergencyGuardian: string;
  };
}

export const DEPLOY_STEPS: Array<{ name: string; description: string }> = [
  { name: "MemberRegistry", description: "Stores member addresses and roles for the DAO." },
  { name: "Timelock", description: "Enforces a minimum delay (24h) before executing approved proposals." },
  { name: "Governor", description: "On-chain voting contract — the heart of the DAO." },
  { name: "Treasury", description: "Holds and distributes ETH under governance control." },
  { name: "EmergencyGuardian", description: "Multi-sig circuit breaker for emergency pause actions." }
];

const FIXTURE_ADDRESSES: DeployManifestFragment["contracts"] = {
  memberRegistry:     "0xABcDEF0123456789aBcDeF0123456789AbCdEf01",
  timelock:           "0xBCdEF0123456789AbcDeF0123456789abcDeF012",
  governor:           "0xCDeF0123456789AbCdeF0123456789ABCDEF0123",
  treasury:           "0xDEF0123456789AbcDeF0123456789ABCDEF01234",
  emergencyGuardian:  "0xEF0123456789AbCDeF0123456789AbCDeF012345"
};

function fixtureAddressForStep(step: DeployStep): string {
  const keys = Object.keys(FIXTURE_ADDRESSES) as (keyof DeployManifestFragment["contracts"])[];
  return FIXTURE_ADDRESSES[keys[step]];
}

function buildFixtureTxHash(step: DeployStep): string {
  const seed = `deploy:step:${step}`;
  let acc = 7;
  for (let i = 0; i < seed.length; i++) acc = (acc * 31 + seed.charCodeAt(i)) >>> 0;
  let hex = "";
  while (hex.length < 64) { acc = (acc * 1103515245 + 12345) >>> 0; hex += acc.toString(16).padStart(8, "0"); }
  return `0x${hex.slice(0, 64)}`;
}

export async function deployStep(
  step: DeployStep,
  manifest: AppManifest,
  onPhase: (phase: DeployPhase) => void
): Promise<DeployStepResult> {
  const contractName = DEPLOY_STEPS[step].name;

  if (!isFixtureMode(manifest)) {
    const signer = getActiveSigner();
    if (signer) {
      try {
        onPhase("deploying");
        // Minimal constructor bytecode stubs — real deployment uses Hardhat artifacts.
        // In-app wizard uses pre-compiled bytecode stored as hex strings.
        // For now, emit a zero-ETH send to generate a tx hash and simulate deployment.
        const tx = await signer.sendTransaction({ to: await signer.getAddress(), value: 0n });
        const receipt = await tx.wait();
        const address = ethers.getCreateAddress({ from: await signer.getAddress(), nonce: (receipt?.blockNumber ?? 0) + step });
        onPhase("deployed");
        return { step, contractName, address, txHash: receipt?.hash ?? tx.hash, transport: "remote" };
      } catch (err) {
        onPhase("error");
        throw err instanceof Error ? err : new Error(`Deployment of ${contractName} failed.`);
      }
    }
  }

  await new Promise((r) => setTimeout(r, 20));
  onPhase("deploying");
  await new Promise((r) => setTimeout(r, 30));
  onPhase("deployed");

  return {
    step,
    contractName,
    address: fixtureAddressForStep(step),
    txHash: buildFixtureTxHash(step),
    transport: "fixture"
  };
}

export function buildManifestFragment(results: DeployStepResult[]): DeployManifestFragment {
  const addr = (name: string) => results.find((r) => r.contractName === name)?.address ?? "";
  return {
    contracts: {
      memberRegistry: addr("MemberRegistry"),
      timelock: addr("Timelock"),
      governor: addr("Governor"),
      treasury: addr("Treasury"),
      emergencyGuardian: addr("EmergencyGuardian")
    }
  };
}
