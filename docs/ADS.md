# AdMob Integration

GOVDAO monetizes the **free tier** with Google AdMob (banner + interstitial). Premium
members are ad-free.

## Identifiers (com.govdao.app)

| Item | ID |
|------|----|
| AdMob App ID | `ca-app-pub-7584543130600454~4392371847` |
| Banner unit | `ca-app-pub-7584543130600454/5417383754` |
| Interstitial unit | `ca-app-pub-7584543130600454/5828742449` |

Configured in `apps/mobile/src/data/adsConfig.ts` and the App ID in `app.json` via the
`react-native-google-mobile-ads` config plugin.

## How it's wired

- **Banner** — `AdBanner` renders an anchored adaptive banner at the bottom of the shell
  on native, for free-plan users only.
- **Interstitial** — `useInterstitialAd` preloads an interstitial and shows it every
  6th screen change (throttled), free-plan only.
- **Gating** — `adsEnabled(manifest)` returns `false` for `features.plan === "premium"`.
- **Dev safety** — in `__DEV__` the code serves Google's official **test** ad units, so
  testing never serves or clicks real ads (which can flag an AdMob account). Real units
  are used only in production builds.

## Platform split (why the web build still works)

The native ads SDK is imported **only** by `AdBanner.native.tsx` and
`useInterstitialAd.native.ts`. The default files (`AdBanner.tsx`,
`useInterstitialAd.ts`) are no-ops, so Metro's web bundle never imports the SDK — the
web export (and CI) stay green. Verified: the web bundle contains none of the SDK
symbols.

## Building with ads

Ads require a native build — they don't run in Expo Go or on web.

```bash
cd apps/mobile
npx expo prebuild --platform android    # applies the AdMob config plugin
npx expo run:android                    # or: eas build -p android --profile production
```

The config plugin injects the App ID into `AndroidManifest.xml` / `Info.plist`
automatically. After installing on a device, test ads appear in dev builds and real ads
in production builds for free-plan users.
