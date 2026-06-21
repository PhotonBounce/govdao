import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import Purchases from "react-native-purchases";
import { AppManifest } from "../types";
import {
  IapState,
  UNSUPPORTED_IAP_STATE,
  PREMIUM_OFFERING_ID,
  PREMIUM_PRODUCT_IDS,
  BillingPeriod,
  isPremiumEntitled,
} from "../data/iapConfig";

export interface IapController {
  state: IapState;
  purchase: (period?: BillingPeriod) => void;
  restore: () => void;
}

function apiKey(): string | null {
  const extra = (Constants.expoConfig?.extra ?? {}) as { revenueCatApiKey?: string };
  const key = extra.revenueCatApiKey;
  return key && key.length > 0 ? key : null;
}

function activeEntitlementIds(info: { entitlements: { active: Record<string, unknown> } }): string[] {
  return Object.keys(info.entitlements.active ?? {});
}

export function useInAppPurchase(_manifest: AppManifest): IapController {
  const [state, setState] = useState<IapState>(UNSUPPORTED_IAP_STATE);

  useEffect(() => {
    if (Platform.OS === "web") {
      setState(UNSUPPORTED_IAP_STATE);
      return;
    }
    const key = apiKey();
    if (!key) {
      setState({ status: "unconfigured", premium: false, detail: "RevenueCat API key not set." });
      return;
    }
    let active = true;
    (async () => {
      try {
        Purchases.configure({ apiKey: key });
        const info = await Purchases.getCustomerInfo();
        const premium = isPremiumEntitled(activeEntitlementIds(info));
        if (active) setState({ status: premium ? "purchased" : "ready", premium, detail: "" });
      } catch {
        if (active) setState({ status: "error", premium: false, detail: "Store unavailable." });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const purchase = useCallback(async (period: BillingPeriod = "monthly") => {
    if (Platform.OS === "web" || !apiKey()) return;
    try {
      const offerings = await Purchases.getOfferings();
      const available = offerings.current?.availablePackages ?? [];
      // Pick the package that matches the requested billing period. Match first on
      // the configured product identifier, then on RevenueCat's packageType, and
      // finally fall back to the first available package so a single-plan offering
      // still works.
      const wantedId = PREMIUM_PRODUCT_IDS[period];
      const wantedType = period === "annual" ? "ANNUAL" : "MONTHLY";
      const pkg =
        available.find((p) => p.product?.identifier === wantedId) ??
        available.find((p) => p.packageType === wantedType) ??
        available[0];
      if (!pkg) {
        setState((s) => ({ ...s, detail: `No packages in the "${PREMIUM_OFFERING_ID}" offering.` }));
        return;
      }
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const premium = isPremiumEntitled(activeEntitlementIds(customerInfo));
      setState({ status: premium ? "purchased" : "ready", premium, detail: premium ? "" : "Purchase not yet active." });
    } catch (err) {
      const cancelled = (err as { userCancelled?: boolean })?.userCancelled;
      if (!cancelled) setState((s) => ({ ...s, status: "error", detail: "Purchase failed." }));
    }
  }, []);

  const restore = useCallback(async () => {
    if (Platform.OS === "web" || !apiKey()) return;
    try {
      const info = await Purchases.restorePurchases();
      const premium = isPremiumEntitled(activeEntitlementIds(info));
      setState({ status: premium ? "purchased" : "ready", premium, detail: premium ? "Purchases restored." : "No previous purchase found." });
    } catch {
      setState((s) => ({ ...s, status: "error", detail: "Restore failed." }));
    }
  }, []);

  return { state, purchase, restore };
}
