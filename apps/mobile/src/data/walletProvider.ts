import { ethers } from "ethers";
import { AppManifest } from "../types";

const PLACEHOLDER_PATTERNS = ["YOUR_", "example.com"];

let _provider: ethers.JsonRpcProvider | null = null;
let _signer: ethers.Signer | null = null;
let _signerAddress: string | null = null;

export function isFixtureMode(manifest: AppManifest): boolean {
  const rpc = manifest.chain.rpcUrl ?? "";
  const governor = manifest.contracts.governor ?? "";
  return (
    PLACEHOLDER_PATTERNS.some((p) => rpc.includes(p)) ||
    governor === "0x0000000000000000000000000000000000000000" ||
    governor === "" ||
    governor.startsWith("0x000000")
  );
}

export function setActiveSigner(signer: ethers.Signer, address: string): void {
  _signer = signer;
  _signerAddress = address;
}

export function getActiveSigner(): ethers.Signer | null {
  return _signer;
}

export function getActiveSignerAddress(): string | null {
  return _signerAddress;
}

export function getProvider(manifest: AppManifest): ethers.JsonRpcProvider | null {
  if (isFixtureMode(manifest)) return null;
  if (!_provider || (_provider as unknown as { _url?: string })._url !== manifest.chain.rpcUrl) {
    try {
      _provider = new ethers.JsonRpcProvider(manifest.chain.rpcUrl);
    } catch {
      return null;
    }
  }
  return _provider;
}

export function clearSession(): void {
  _signer = null;
  _signerAddress = null;
}

export function buildContract(
  address: string,
  abi: readonly string[],
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  return new ethers.Contract(address, abi as ethers.InterfaceAbi, signerOrProvider);
}
