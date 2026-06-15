import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { InterstitialAd, AdEventType, TestIds } from "react-native-google-mobile-ads";
import { AppManifest } from "../types";
import { adsEnabled, interstitialUnitId } from "../data/adsConfig";

export interface InterstitialController {
  showInterstitial: () => void;
  loaded: boolean;
}

// Native interstitial: preloads on mount, shows on demand, and reloads after close.
// No-ops for premium members, on web, or if loading fails.
export function useInterstitialAd(manifest: AppManifest): InterstitialController {
  const adRef = useRef<InterstitialAd | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web" || !adsEnabled(manifest)) {
      return;
    }

    const unitId = __DEV__ ? TestIds.INTERSTITIAL : interstitialUnitId(false);
    let ad: InterstitialAd;
    try {
      ad = InterstitialAd.createForAdRequest(unitId);
    } catch {
      return;
    }
    adRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => setLoaded(true));
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      try {
        ad.load();
      } catch {
        // best-effort reload
      }
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => setLoaded(false));

    try {
      ad.load();
    } catch {
      // ignore — loaded stays false and show() becomes a no-op
    }

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
      adRef.current = null;
    };
  }, [manifest]);

  function showInterstitial() {
    if (loaded && adRef.current) {
      try {
        adRef.current.show();
      } catch {
        // ignore show failures
      }
    }
  }

  return { showInterstitial, loaded };
}
