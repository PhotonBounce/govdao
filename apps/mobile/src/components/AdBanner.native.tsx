import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { AppManifest } from "../types";
import { adsEnabled, bannerUnitId } from "../data/adsConfig";

interface AdBannerProps {
  manifest: AppManifest;
}

// Native (iOS/Android) anchored adaptive banner. Hidden for premium members, on web,
// and if the ad fails to load — so it never leaves a blank gap.
export function AdBanner({ manifest }: AdBannerProps) {
  const [failed, setFailed] = useState(false);

  if (Platform.OS === "web" || !adsEnabled(manifest) || failed) {
    return null;
  }

  const unitId = __DEV__ ? TestIds.BANNER : bannerUnitId(false);

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d0d1a",
  },
});
