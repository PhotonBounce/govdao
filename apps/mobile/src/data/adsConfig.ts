import { AppManifest } from "../types";

// Production AdMob identifiers for GOVDAO (com.govdao.app).
export const ADMOB_APP_ID = "ca-app-pub-7584543130600454~4392371847";

export const AD_UNIT_IDS = {
  banner: "ca-app-pub-7584543130600454/5417383754",
  interstitial: "ca-app-pub-7584543130600454/5828742449",
} as const;

// Google's official test unit IDs — used in dev so we never serve (or click) real
// ads during testing, which can get an AdMob account flagged.
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

/** Show an interstitial every Nth screen change (throttled so it isn't intrusive). */
export const INTERSTITIAL_NAV_INTERVAL = 6;

export function shouldShowInterstitial(navCount: number): boolean {
  return navCount > 0 && navCount % INTERSTITIAL_NAV_INTERVAL === 0;
}
