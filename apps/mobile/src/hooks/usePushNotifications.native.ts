import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { AppManifest } from "../types";
import {
  PushState,
  PushPermissionStatus,
  UNSUPPORTED_PUSH_STATE,
  pushEnabled,
  pushChannels,
} from "../data/pushConfig";

export interface PushController {
  state: PushState;
  register: () => void;
}

// Foreground notifications surface as a banner with sound.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const importanceMap: Record<string, number> = {
  high: Notifications.AndroidImportance.HIGH,
  default: Notifications.AndroidImportance.DEFAULT,
  low: Notifications.AndroidImportance.LOW,
};

function getProjectId(): string | undefined {
  const extra = (Constants.expoConfig?.extra ?? {}) as { eas?: { projectId?: string } };
  return extra.eas?.projectId ?? (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
}

export function usePushNotifications(manifest: AppManifest): PushController {
  const [state, setState] = useState<PushState>(
    pushEnabled(manifest) && Platform.OS !== "web"
      ? { supported: true, status: "undetermined", token: null, detail: "Push is available — tap Enable to register." }
      : UNSUPPORTED_PUSH_STATE
  );

  const register = useCallback(async () => {
    if (!pushEnabled(manifest) || Platform.OS === "web") {
      setState(UNSUPPORTED_PUSH_STATE);
      return;
    }

    try {
      if (Platform.OS === "android") {
        for (const channel of pushChannels(manifest)) {
          await Notifications.setNotificationChannelAsync(channel.id, {
            name: channel.name,
            importance: importanceMap[channel.importance] ?? Notifications.AndroidImportance.DEFAULT,
          });
        }
      }

      const existing = await Notifications.getPermissionsAsync();
      let status = existing.status;
      if (status !== "granted") {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }

      if (status !== "granted") {
        setState({ supported: true, status: status as PushPermissionStatus, token: null, detail: "Permission was not granted." });
        return;
      }

      let token: string | null = null;
      try {
        const projectId = getProjectId();
        const result = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        token = result.data;
      } catch (err) {
        setState({
          supported: true,
          status: "granted",
          token: null,
          detail: "Permission granted, but a push token needs an EAS projectId — set one with `eas build`.",
        });
        return;
      }

      setState({ supported: true, status: "granted", token, detail: "Registered for governance push alerts." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "registration failed";
      setState({ supported: true, status: "undetermined", token: null, detail: `Push registration error: ${message}.` });
    }
  }, [manifest]);

  useEffect(() => {
    if (!Device.isDevice) {
      setState({ supported: false, status: "unsupported", token: null, detail: "Push notifications need a physical device (not a simulator)." });
    }
  }, []);

  return { state, register };
}
