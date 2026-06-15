import { AppManifest } from "../types";

export interface InterstitialController {
  showInterstitial: () => void;
  loaded: boolean;
}

// Web / default: interstitials are a no-op. The native SDK is only imported by
// useInterstitialAd.native.ts, so it never enters the web bundle.
export function useInterstitialAd(_manifest: AppManifest): InterstitialController {
  return { showInterstitial: () => {}, loaded: false };
}
