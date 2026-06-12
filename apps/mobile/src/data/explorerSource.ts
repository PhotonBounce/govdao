import { AppManifest } from "../types";

const TX_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

function isPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("example.") || normalized.includes("your_");
}

function getExplorerBase(manifest: AppManifest): string | null {
  const base = manifest.chain.blockExplorer?.trim() ?? "";

  if (!base.startsWith("https://") || isPlaceholder(base)) {
    return null;
  }

  return base.replace(/\/$/, "");
}

export function buildExplorerTxUrl(manifest: AppManifest, txHash: string): string | null {
  const base = getExplorerBase(manifest);

  if (!base || !TX_HASH_PATTERN.test(txHash.trim())) {
    return null;
  }

  return `${base}/tx/${txHash.trim()}`;
}

export function buildExplorerAddressUrl(manifest: AppManifest, address: string): string | null {
  const base = getExplorerBase(manifest);

  if (!base || !ADDRESS_PATTERN.test(address.trim())) {
    return null;
  }

  return `${base}/address/${address.trim()}`;
}
