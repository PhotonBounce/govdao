import { AppManifest } from "../types";
import { isFixtureMode, getActiveSigner, buildContract } from "./walletProvider";
import { MEMBER_REGISTRY_ABI, ROLE_LABELS } from "./contractAbis";

export type AccessMethodKind = "wallet" | "offchain";
export type SessionTransport = "fixture" | "remote";

export interface AccessOption {
  id: string;
  label: string;
  kind: AccessMethodKind;
  detail: string;
}

export interface SessionIdentity {
  methodId: string;
  methodLabel: string;
  kind: AccessMethodKind;
  memberLabel: string;
  address: string;
  role: string;
  transport: SessionTransport;
  connectedAt: string;
}

const HANDSHAKE_DELAY_MS = 350;

const methodLabels: Record<string, string> = {
  walletconnect: "WalletConnect",
  "coinbase-wallet": "Coinbase Wallet",
  injected: "Injected Wallet",
  passkey: "Passkey",
  "email-otp": "Email OTP",
  oauth: "OAuth",
  "wallet-signature": "Wallet Signature"
};

const fixtureSigners: Record<string, { memberLabel: string; address: string; role: string }> = {
  walletconnect: { memberLabel: "Delegate Desk", address: "0x7A3f19c4E2b8D6a1F0c5B9e8A2d4C6f8E1a3B5c7", role: "Proposer" },
  "coinbase-wallet": { memberLabel: "Treasury Steward", address: "0x4B8e2D6f1A9c3E5b7D0f2A4c6E8b1D3f5A7c9E0b", role: "Member" },
  injected: { memberLabel: "Operations Lead", address: "0x9C1d3F5a7B9e0D2f4A6c8E1b3D5f7A9c0E2b4D6f", role: "Member" },
  passkey: { memberLabel: "Member Success Reviewer", address: "0x2E4b6D8f0A1c3E5b7D9f2A4c6E8b0D1f3A5c7E9b", role: "Reviewer" },
  "wallet-signature": { memberLabel: "Community Delegate", address: "0x6F8a0C2e4B6d8F1a3C5e7B9d0F2a4C6e8B1d3F5a", role: "Delegate" }
};

const defaultSigner = { memberLabel: "Guest Member", address: "0x0A2c4E6b8D1f3A5c7E9b0D2f4A6c8E1b3D5f7A9c", role: "Observer" };

export function formatMethodLabel(methodId: string): string {
  return (
    methodLabels[methodId] ??
    methodId
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export function getAccessOptions(manifest: AppManifest): AccessOption[] {
  const walletOptions: AccessOption[] = manifest.wallet.supported.map((walletId) => ({
    id: walletId,
    label: formatMethodLabel(walletId),
    kind: "wallet",
    detail: `Connect and sign on-chain governance actions with ${formatMethodLabel(walletId)}.`
  }));

  const offchainOptions: AccessOption[] = manifest.governance.offchain.enabled
    ? manifest.governance.offchain.auth
        .filter((authId) => !walletOptions.some((option) => option.id === authId))
        .map((authId) => ({
          id: authId,
          label: formatMethodLabel(authId),
          kind: "offchain",
          detail: `Authenticate motions, drafts, and approvals with ${formatMethodLabel(authId)}.`
        }))
    : [];

  return [...walletOptions, ...offchainOptions];
}

function getTimestamp(): string {
  return new Date().toISOString();
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

export async function connectSession(option: AccessOption, manifest: AppManifest): Promise<SessionIdentity> {
  if (!isFixtureMode(manifest)) {
    const signer = getActiveSigner();
    if (signer) {
      try {
        const address = await signer.getAddress();
        let role = "Member";
        try {
          const registry = buildContract(manifest.contracts.memberRegistry, MEMBER_REGISTRY_ABI, signer);
          const roleEnum = Number(await registry.getRole(address));
          role = ROLE_LABELS[roleEnum] ?? "Member";
        } catch {
          // registry query failure is non-fatal; default to "Member"
        }
        return {
          methodId: option.id,
          methodLabel: option.label,
          kind: option.kind,
          memberLabel: address.slice(0, 6) + "…" + address.slice(-4),
          address,
          role,
          transport: "remote",
          connectedAt: getTimestamp()
        };
      } catch {
        // signer.getAddress() failure falls through to fixture path
      }
    }
  }

  await wait(HANDSHAKE_DELAY_MS);
  const signer = fixtureSigners[option.id] ?? defaultSigner;

  return {
    methodId: option.id,
    methodLabel: option.label,
    kind: option.kind,
    memberLabel: signer.memberLabel,
    address: signer.address,
    role: signer.role,
    transport: "fixture",
    connectedAt: getTimestamp()
  };
}

export function shortenAddress(address: string): string {
  if (address.length <= 12) {
    return address;
  }

  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
