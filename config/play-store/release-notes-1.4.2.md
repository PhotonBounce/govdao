# GOVDAO 1.4.2 — release notes

## What's new (user-facing)

• Updated to target Android 16 for the latest platform security and performance.
• Verified compatibility with Google Play Billing for subscriptions.
• Stability and polish across the app.

## Play Console compliance (why this release exists)

This release clears two Google Play Console requirements:

1. **Target API level** — Google Play requires apps to target within one year of the
   latest Android release (enforced Aug 30, 2026). Bumped `targetSdkVersion` and
   `compileSdkVersion` from **35 (Android 15) → 36 (Android 16)** in
   `apps/mobile/app.json` (expo-build-properties).

2. **Google Play Billing Library** — the app declares
   `com.android.billingclient:billing:8.0.0`, which satisfies the mandatory
   "8.0.0 or later" requirement. The Console warning clears once this build is
   published to an active track. (Google *recommends* v9 for the newest monetization
   features — optional; adopt only after validating on an internal track that the
   IAP layer supports it.)

## Version

- versionName: 1.4.2
- versionCode: 13
- Guarded by `apps/mobile/scripts/check-app-config.mjs` (targetSdk ≥ 36, Billing ≥ 8.0.0).

## Ship steps

1. Build a new AAB (`build-eas.bat` / EAS) with these config values.
2. Upload to an **internal testing** track first, confirm subscriptions + launch on
   an Android 16 device/emulator.
3. Promote to production to clear both Console warnings.
