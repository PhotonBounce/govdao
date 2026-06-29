import { AppManifest } from "../types";

// Load from environment variables (injected at build time)
const ADMOB_APP_ID = process.env.EXPO_PUBLIC_ADMOB_APP_ID || "";
const ADMOB_BANNER_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || "";
const ADMOB_INTERSTITIAL_ID = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || "";

export const AD_UNIT_IDS = {
  banner: ADMOB_BANNER_ID,
  interstitial: ADMOB_INTERSTITIAL_ID,
} as const;

// Google's official test unit IDs — safe to keep in code
export const TEST_AD_UNIT_IDS = {
  banner: "ca-app-pub-3940256099942544/6300978111",
  interstitial: "ca-app-pub-3940256099942544/1033173712",
} as const;

/** Ads monetize the free tier only — premium members get an ad-free experience. */
export function adsEnabled(manifest: AppManifest): boolean {
  return (manifest.features?.plan ?? "free") !== "premium";
}

export function bannerUnitId(useTestAds: boolean): string {
  return useTestAds ? TEST_AD_UNIT_IDS.banner : AD_UNIT_IDS.banner;
}

export function interstitialUnitId(useTestAds: boolean): string {
  return useTestAds ? TEST_AD_UNIT_IDS.interstitial : AD_UNIT_IDS.interstitial;
}
