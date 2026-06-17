import { ethers } from "ethers";
import { Platform } from "react-native";
import { AppManifest } from "../types";

const PLACEHOLDER_PATTERNS = ["YOUR_", "example.com", "localhost", "127.0.0.1"];

let _provider: ethers.JsonRpcProvider | null = null;
let _browserProvider: ethers.BrowserProvider | null = null;
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
  _browserProvider = null;
}

export interface InjectedWalletResult {
  address: string;
  chainId: number;
}

/**
 * Connects MetaMask (or any EIP-1193 injected wallet) in a web/browser context.
 * On React Native, this is a no-op that throws so callers can show a "use mobile
 * wallet" fallback instead. Switches the network to `requiredChainId` if provided.
 */
export async function connectInjectedWallet(requiredChainId?: number): Promise<InjectedWalletResult> {
  if (Platform.OS !== "web") {
    throw new Error("Injected wallet only available on web — use WalletConnect on mobile.");
  }

  const win = globalThis as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } };
  if (!win.ethereum) {
    throw new Error("No injected wallet found. Install MetaMask at metamask.io.");
  }

  _browserProvider = new ethers.BrowserProvider(win.ethereum as Parameters<typeof ethers.BrowserProvider>[0]);

  await _browserProvider.send("eth_requestAccounts", []);

  if (requiredChainId !== undefined) {
    const network = await _browserProvider.getNetwork();
    if (Number(network.chainId) !== requiredChainId) {
      try {
        await _browserProvider.send("wallet_switchEthereumChain", [
          { chainId: `0x${requiredChainId.toString(16)}` }
        ]);
        _browserProvider = new ethers.BrowserProvider(win.ethereum as Parameters<typeof ethers.BrowserProvider>[0]);
      } catch {
        throw new Error(
          `MetaMask is on chain ${network.chainId} — switch to chain ${requiredChainId} (Sepolia = 11155111) and try again.`
        );
      }
    }
  }

  const signer = await _browserProvider.getSigner();
  const address = await signer.getAddress();
  const { chainId } = await _browserProvider.getNetwork();

  setActiveSigner(signer, address);
  return { address, chainId: Number(chainId) };
}

export function getBrowserProvider(): ethers.BrowserProvider | null {
  return _browserProvider;
}

export function buildContract(
  address: string,
  abi: readonly string[],
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  return new ethers.Contract(address, abi as ethers.InterfaceAbi, signerOrProvider);
}
