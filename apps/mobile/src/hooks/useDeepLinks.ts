import { useEffect } from "react";
import { Linking } from "react-native";
import { parseDeepLink } from "../data/deepLinkSource";
import { ActiveView } from "../shellTypes";

/**
 * Routes incoming deep links / universal links to a view. Uses React Native's
 * Linking, which is universal (also works on web via react-native-web), so no
 * platform split is needed.
 */
export function useDeepLinks(onNavigate: (view: ActiveView) => void) {
  useEffect(() => {
    let mounted = true;

    Linking.getInitialURL()
      .then((url) => {
        if (!mounted || !url) return;
        const target = parseDeepLink(url);
        if (target) onNavigate(target.view);
      })
      .catch(() => {
        // no initial URL — fine
      });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      const target = parseDeepLink(url);
      if (target) onNavigate(target.view);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [onNavigate]);
}
