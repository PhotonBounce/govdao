import { AppManifest } from "../types";

export interface OnchainSnapshot {
  available: boolean;
  detail: string;
  blockNumber: string | null;
  treasuryBalance: string | null;
  treasuryPaused: boolean | null;
  spendCapPerTx: string | null;
  memberCount: string | null;
  guardianPaused: boolean | null;
}

const REQUEST_TIMEOUT_MS = 4000;

// 4-byte selectors precomputed from the GOVDAO contract ABIs (keccak256 of the signature).
const SELECTORS = {
  treasuryPaused: "0x5c975abb", // paused()
  spendCapPerTx: "0x95692e28", // spendCapPerTx()
  memberCount: "0x997072f7", // getMemberCount()
  guardianPaused: "0xb187bd26" // isPaused()
};

function isPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("example.") || normalized.includes("your_") || /^0x0{40}$/i.test(normalized);
}

export function isChainConfigured(manifest: AppManifest): boolean {
  return (
    !isPlaceholder(manifest.chain.rpcUrl) &&
    !isPlaceholder(manifest.contracts.treasury) &&
    !isPlaceholder(manifest.contracts.memberRegistry) &&
    !isPlaceholder(manifest.contracts.emergencyGuardian)
  );
}

export function buildUnavailableSnapshot(detail: string): OnchainSnapshot {
  return {
    available: false,
    detail,
    blockNumber: null,
    treasuryBalance: null,
    treasuryPaused: null,
    spendCapPerTx: null,
    memberCount: null,
    guardianPaused: null
  };
}

interface JsonRpcResponse {
  result?: string;
  error?: { message?: string };
}

async function rpcCall(rpcUrl: string, method: string, params: unknown[]): Promise<string> {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: controller.signal
  }).catch((error: unknown) => {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`RPC request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }

    throw error;
  }).finally(() => {
    clearTimeout(timeoutHandle);
  });

  if (!response.ok) {
    throw new Error(`RPC request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as JsonRpcResponse;

  if (payload.error || typeof payload.result !== "string") {
    throw new Error(payload.error?.message ?? "RPC call returned no result");
  }

  return payload.result;
}

function ethCall(rpcUrl: string, to: string, selector: string): Promise<string> {
  return rpcCall(rpcUrl, "eth_call", [{ to, data: selector }, "latest"]);
}

function hexToBigInt(value: string): bigint {
  return value === "0x" ? 0n : BigInt(value);
}

function formatEth(weiHex: string): string {
  const wei = hexToBigInt(weiHex);
  const whole = wei / 1000000000000000000n;
  const fraction = (wei % 1000000000000000000n) / 100000000000000n; // 4 decimal places
  return `${whole.toString()}.${fraction.toString().padStart(4, "0")} ETH`;
}

function hexToBool(value: string): boolean {
  return hexToBigInt(value) !== 0n;
}

function settled<T>(result: PromiseSettledResult<string>, transform: (value: string) => T): T | null {
  return result.status === "fulfilled" ? transform(result.value) : null;
}

export async function loadOnchainSnapshot(manifest: AppManifest): Promise<OnchainSnapshot> {
  if (!isChainConfigured(manifest)) {
    return buildUnavailableSnapshot(
      "On-chain verification is waiting on a real RPC endpoint and deployed contract addresses in the manifest."
    );
  }

  const rpcUrl = manifest.chain.rpcUrl;

  let blockNumberHex: string;
  try {
    blockNumberHex = await rpcCall(rpcUrl, "eth_blockNumber", []);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "the RPC endpoint was unreachable";
    return buildUnavailableSnapshot(`On-chain verification is configured but unreachable: ${message}.`);
  }

  const [balance, treasuryPaused, spendCap, memberCount, guardianPaused] = await Promise.allSettled([
    rpcCall(rpcUrl, "eth_getBalance", [manifest.contracts.treasury, "latest"]),
    ethCall(rpcUrl, manifest.contracts.treasury, SELECTORS.treasuryPaused),
    ethCall(rpcUrl, manifest.contracts.treasury, SELECTORS.spendCapPerTx),
    ethCall(rpcUrl, manifest.contracts.memberRegistry, SELECTORS.memberCount),
    ethCall(rpcUrl, manifest.contracts.emergencyGuardian, SELECTORS.guardianPaused)
  ]);

  return {
    available: true,
    detail: `Live reads from ${manifest.chain.name} at block ${hexToBigInt(blockNumberHex).toString()}.`,
    blockNumber: hexToBigInt(blockNumberHex).toString(),
    treasuryBalance: settled(balance, formatEth),
    treasuryPaused: settled(treasuryPaused, hexToBool),
    spendCapPerTx: settled(spendCap, formatEth),
    memberCount: settled(memberCount, (value) => hexToBigInt(value).toString()),
    guardianPaused: settled(guardianPaused, hexToBool)
  };
}
