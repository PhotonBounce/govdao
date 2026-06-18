import { ethers } from "ethers";
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

/** Everything MetaMask needs to switch to — or add — a target network. */
export interface InjectedChainConfig {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrencySymbol: string;
}

interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

function toHexChainId(id: number): string {
  return `0x${id.toString(16)}`;
}

/**
 * True only in a browser runtime (Expo web / react-native-web). False on native
 * and in Node — this avoids importing react-native into the data layer, which the
 * Node-based QA gates load directly.
 */
export function isWebRuntime(): boolean {
  return typeof document !== "undefined";
}

/**
 * Connects MetaMask (or any EIP-1193 injected wallet) in a web/browser context.
 * On React Native, this throws so callers can fall back to WalletConnect.
 * If `chain` is supplied it switches MetaMask to that network, adding it first
 * (wallet_addEthereumChain) when the wallet doesn't know it yet — e.g. Polygon.
 */
export async function connectInjectedWallet(chain?: InjectedChainConfig): Promise<InjectedWalletResult> {
  if (!isWebRuntime()) {
    throw new Error("Injected wallet only available on web — use WalletConnect on mobile.");
  }

  const eth = (globalThis as unknown as { ethereum?: Eip1193Provider }).ethereum;
  if (!eth) {
    throw new Error("No injected wallet found. Install MetaMask at metamask.io.");
  }

  _browserProvider = new ethers.BrowserProvider(eth as ConstructorParameters<typeof ethers.BrowserProvider>[0]);
  await _browserProvider.send("eth_requestAccounts", []);

  if (chain) {
    const network = await _browserProvider.getNetwork();
    if (Number(network.chainId) !== chain.chainId) {
      const hexId = toHexChainId(chain.chainId);
      try {
        await _browserProvider.send("wallet_switchEthereumChain", [{ chainId: hexId }]);
      } catch (switchError: unknown) {
        const code = (switchError as { code?: number; data?: { originalError?: { code?: number } } })?.code;
        const nestedCode = (switchError as { data?: { originalError?: { code?: number } } })?.data?.originalError?.code;
        // 4902 = chain not added to the wallet yet → add it, then it becomes active.
        if (code === 4902 || nestedCode === 4902) {
          await _browserProvider.send("wallet_addEthereumChain", [{
            chainId: hexId,
            chainName: chain.chainName,
            nativeCurrency: { name: chain.nativeCurrencySymbol, symbol: chain.nativeCurrencySymbol, decimals: 18 },
            rpcUrls: [chain.rpcUrl],
            blockExplorerUrls: [chain.blockExplorer]
          }]);
        } else {
          throw new Error(
            `Couldn't switch MetaMask to ${chain.chainName} (chain ${chain.chainId}). Switch manually and retry.`
          );
        }
      }
      // Re-bind the provider after a network change so the signer targets the new chain.
      _browserProvider = new ethers.BrowserProvider(eth as ConstructorParameters<typeof ethers.BrowserProvider>[0]);
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
