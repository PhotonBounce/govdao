# GOVDAO 1.4.1 (versionCode 12) — Release Notes

**Release date:** 2026-07-03
**Track:** Production-ready · Play Console compliance release
**Artifacts:** `GOVDAO.aab` (Play upload, signed with upload key) · `GOVDAO.apk` (sideload/testing)

---

## Play Console release notes (paste into "Release notes" box)

```
<en-US>
• Full Android 15 edge-to-edge support — the app now draws beautifully behind the status and navigation bars on every device
• Large-screen ready: free rotation and resizable layouts on tablets and foldables (Android 16 ready)
• Upgraded Google Play Billing to version 8 for faster, more reliable premium subscriptions
• Smoother navigation: the tab bar now scrolls horizontally and every screen opens right at its content
• Refreshed onboarding with a cleaner look and quicker start
• Stability fixes and performance improvements throughout
</en-US>
```

---

## What changed since 1.4.0 (versionCode 11)

### Google Play compliance
- **Play Billing Library 7.1.1 → 8.0.0** (`com.android.billingclient:billing:8.0.0`), paired with
  `react-native-purchases` 8.12 → **10.4.1** (RevenueCat SDK bundling BillingClient 8).
- **Edge-to-edge enabled** for Android 15 / target SDK 35 (`edgeToEdgeEnabled: true`), with proper
  inset handling via `react-native-safe-area-context` (status bar, gesture nav, anchored ad banner).
  Removes the deprecated window/status-bar API usage flagged by the Play Console.
- **Orientation & resizability restrictions removed** (`orientation: "default"`) per Android 16
  large-screen guidance — verified in landscape, tablet portrait, and tablet landscape.
- **Ads SDK on latest compatible release** — `react-native-google-mobile-ads` 14.11.0
  (Google Mobile Ads Android SDK 23.6). Note: the v16 wrapper (GMA SDK 24) requires the
  React Native 0.80+ / Expo SDK 54 platform migration, planned post-release.

### UX / QA fixes (this cycle)
- Tab bar is a horizontally scrollable pill row (previously wrapped into 3 rows on phones).
- Every tab auto-scrolls its content into view on switch; hero header compacted.
- Debug indicators (route info, data-mode pill, fixture strips) hidden in production builds.
- Onboarding: solid backdrop (no more animated background bleed-through on steps 7–8).
- Fixed stat-card overflow clipping on narrow screens.
- Tab content no longer renders stale on web (React Native Web remount fix).

### Versioning
- `versionCode` **12**, `versionName` **1.4.1** (console previously at 11 / 1.4.0).
- iOS `buildNumber` 3 (parity bump; no iOS release this cycle).

---

## Play Console checklist for this release
1. Upload `GOVDAO.aab` to your chosen track (internal → production recommended).
2. Paste the `<en-US>` notes above into Release notes.
3. **Before Jul 22:** review *Needs attention → third-party app store availability* preference.
4. Data Safety form: no personal data collected; advertising ID used for free-tier ads (AdMob).
5. Content rating (IARC) + Financial features / cryptocurrency declaration if not yet completed.

## Known non-blockers
- RevenueCat API key (`extra.revenueCatApiKey`) is empty — premium purchases show as
  "unconfigured" until a key is added; the app degrades gracefully. Ads monetization is active.
- On-chain mode requires deployed contracts; app ships in demo/fixture mode until
  the Polygon deploy workflow is run.
