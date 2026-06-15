import { AppManifest } from "../types";
import { IapState, UNSUPPORTED_IAP_STATE } from "../data/iapConfig";

export interface IapController {
  state: IapState;
  purchase: () => void;
  restore: () => void;
}

// Web / default: purchases are a no-op. The react-native-purchases SDK is only
// imported by useInAppPurchase.native.ts, so it never enters the web bundle.
export function useInAppPurchase(_manifest: AppManifest): IapController {
  return { state: UNSUPPORTED_IAP_STATE, purchase: () => {}, restore: () => {} };
}
