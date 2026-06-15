import { AppManifest } from "../types";

interface AdBannerProps {
  manifest: AppManifest;
}

// Web / default implementation: no ads on the web build. The native ads SDK is only
// imported by AdBanner.native.tsx, so it never enters the web bundle.
export function AdBanner(_props: AdBannerProps) {
  return null;
}
