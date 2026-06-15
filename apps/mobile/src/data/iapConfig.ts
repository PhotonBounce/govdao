import { AppManifest } from "../types";

// RevenueCat entitlement + product identifiers. Configure matching products in the
// Play Console and RevenueCat dashboard, and set extra.revenueCatApiKey in app config.
export const PREMIUM_ENTITLEMENT_ID = "premium";
export const PREMIUM_OFFERING_ID = "default";
export const PREMIUM_PRODUCT_IDS = {
  monthly: "govdao_premium_monthly",
  annual: "govdao_premium_annual",
} as const;

export type IapStatus = "unconfigured" | "ready" | "purchased" | "unsupported" | "error";

export interface IapState {
  status: IapStatus;
  premium: boolean;
  detail: string;
}

export const UNSUPPORTED_IAP_STATE: IapState = {
  status: "unsupported",
  premium: false,
  detail: "In-app purchases are available on native device builds.",
};

/** Offer the upgrade to free-tier users (premium members already have everything). */
export function iapOffered(manifest: AppManifest): boolean {
  return (manifest.features?.plan ?? "free") !== "premium";
}

/** True when the RevenueCat customer holds the premium entitlement. */
export function isPremiumEntitled(activeEntitlementIds: string[]): boolean {
  return activeEntitlementIds.includes(PREMIUM_ENTITLEMENT_ID);
}

export function describeIapStatus(state: IapState): string {
  switch (state.status) {
    case "purchased":
      return "Premium active — thanks for supporting GOVDAO. Ads are off and every feature is unlocked.";
    case "ready":
      return "Upgrade to Premium to remove ads and unlock analytics, the deploy wizard, guardian drills and export.";
    case "unconfigured":
      return "In-app purchases need a RevenueCat API key — set extra.revenueCatApiKey in app config.";
    case "unsupported":
      return "Purchases are available on native device builds.";
    default:
      return "Could not reach the store right now. Try again shortly.";
  }
}
