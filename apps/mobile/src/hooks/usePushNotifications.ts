import { AppManifest } from "../types";
import { PushState, UNSUPPORTED_PUSH_STATE } from "../data/pushConfig";

export interface PushController {
  state: PushState;
  register: () => void;
  sendTest: () => void;
}

// Web / default: push is a no-op. The expo-notifications SDK is only imported by
// usePushNotifications.native.ts, so it never enters the web bundle.
export function usePushNotifications(_manifest: AppManifest): PushController {
  return { state: UNSUPPORTED_PUSH_STATE, register: () => {}, sendTest: () => {} };
}
