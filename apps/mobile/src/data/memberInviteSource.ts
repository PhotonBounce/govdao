import { ethers } from "ethers";
import { AppManifest } from "../types";
import { SessionIdentity } from "./sessionSource";
import { isFixtureMode, getActiveSigner, buildContract } from "./walletProvider";
import { GOVERNOR_ABI, MEMBER_REGISTRY_ABI, roleNameToEnum } from "./contractAbis";

export type InvitePhase = "idle" | "validating" | "submitting" | "pending" | "error";

export interface InviteDraft {
  address: string;
  role: string;
  displayName: string;
}

export interface InviteReceipt {
  inviteId: string;
  address: string;
  role: string;
  displayName: string;
  timelockLabel: string;
  transport: "fixture" | "remote";
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

const PREDEFINED_ROLES = [
  "Delegate",
  "Guardian Delegate",
  "Treasury Steward",
  "Protocol Operator",
  "Community Lead"
];

export const INVITE_ROLES = PREDEFINED_ROLES;

export function validateInviteDraft(draft: InviteDraft): string[] {
  const errors: string[] = [];

  if (!ADDRESS_RE.test(draft.address.trim())) {
    errors.push("Address must be a valid Ethereum address (0x…40 hex chars).");
  }

  if (!draft.role.trim() || draft.role.trim().length < 4) {
    errors.push("Role must be at least 4 characters.");
  }

  if (!draft.displayName.trim() || draft.displayName.trim().length < 3) {
    errors.push("Display name must be at least 3 characters.");
  }

  return errors;
}

function buildInviteId(): string {
  return `MBR-${String(5 + Math.floor(Math.random() * 95)).padStart(3, "0")}`;
}

export async function submitMemberInvite(
  draft: InviteDraft,
  identity: SessionIdentity | null,
  manifest: AppManifest,
  onPhase: (phase: InvitePhase) => void
): Promise<InviteReceipt> {
  onPhase("validating");

  const errors = validateInviteDraft(draft);
  if (errors.length > 0) {
    onPhase("error");
    throw new Error(errors[0]);
  }

  if (!identity) {
    onPhase("error");
    throw new Error("Active member session required to submit an invitation.");
  }

  if (!isFixtureMode(manifest)) {
    const signer = getActiveSigner();
    if (signer) {
      try {
        onPhase("submitting");
        // MemberRegistry.addMember is governance-gated (onlyGovernance), so a member
        // can't add directly. The correct path is a proposal whose action calls
        // registry.addMember(account, role); it takes effect once executed.
        const governor = buildContract(manifest.contracts.governor, GOVERNOR_ABI, signer);
        const registryIface = new ethers.Interface([...MEMBER_REGISTRY_ABI]);
        const calldata = registryIface.encodeFunctionData("addMember", [
          draft.address.trim(),
          roleNameToEnum(draft.role)
        ]);
        const metadataURI = `govdao://invite/${encodeURIComponent(draft.displayName.trim())}`;
        const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(`${draft.address}\n${draft.role}\n${draft.displayName}`));

        const tx = await governor.propose([manifest.contracts.memberRegistry], [0n], [calldata], metadataURI, metadataHash);
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

        onPhase("pending");
        return {
          inviteId: `GOV-${proposalId}`,
          address: draft.address.trim(),
          role: draft.role.trim(),
          displayName: draft.displayName.trim(),
          timelockLabel: "Proposed on-chain — pending vote & execution",
          transport: "remote"
        };
      } catch (err) {
        onPhase("error");
        throw err instanceof Error ? err : new Error("On-chain member invitation failed.");
      }
    }
  }

  await new Promise((r) => setTimeout(r, 20));
  onPhase("submitting");
  await new Promise((r) => setTimeout(r, 20));
  onPhase("pending");

  return {
    inviteId: buildInviteId(),
    address: draft.address.trim(),
    role: draft.role.trim(),
    displayName: draft.displayName.trim(),
    timelockLabel: "Pending registry confirmation — 24h timelock",
    transport: "fixture"
  };
}
