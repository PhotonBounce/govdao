# Building & Installing the GOVDAO Android App

This document explains how to get a real, installable APK onto your phone — **without
Expo Go** — and why the build can't happen inside the Claude Code cloud container.

## Why the cloud container can't build the APK

The remote session that generated this code runs in an isolated Linux container with:

- **No Android SDK** — `adb`, `sdkmanager`, and `platform-tools` are not installed, and
  `ANDROID_HOME` is unset.
- **A network egress allowlist** that blocks `dl.google.com`, so the Android SDK cannot
  be downloaded into the container.
- **No USB access to your phone** — a cloud container physically cannot see a device
  plugged into your Windows machine, so `adb install` from the container is impossible.

So the APK has to be produced either by Expo's cloud build service (EAS) or on your own
Windows machine. Both paths are set up for you below.

---

## Option A — EAS cloud build (recommended, no local Android SDK needed)

Expo builds the APK on their servers and gives you a download link. You install it by
tapping the link on your phone — no Expo Go, no USB cable.

```bash
cd apps/mobile

# one-time: install the CLI and log in to a free Expo account
npm install -g eas-cli
eas login

# build an installable APK using the "internal" profile in eas.json
eas build --platform android --profile internal
```

When the build finishes, EAS prints a URL (and emails it). Open that URL on your Android
phone and tap **Install**. You may need to allow "Install from unknown sources" the first
time.

The `internal` profile in `apps/mobile/eas.json` is already set to `buildType: "apk"`
(not an `.aab` app bundle), which is what you want for direct sideloading.

## Option B — Local build on your Windows machine

If you'd rather build locally and push over USB:

1. Install **Android Studio** (bundles the Android SDK + platform-tools).
2. Enable **Developer options → USB debugging** on your phone and plug it in.
3. From the repo:

   ```bash
   cd apps/mobile
   npx expo prebuild --platform android      # generates the native android/ project
   npx expo run:android                      # builds and installs to the connected phone
   ```

   `expo run:android` compiles a debug APK and installs it straight to the device over USB
   via `adb`.

To produce a standalone release APK you can share as a file:

```bash
cd apps/mobile/android
./gradlew assembleRelease
# output: apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

## Option C — Let the cloud container build it

If you want the remote session to build the APK directly, add `dl.google.com` (and
`dl.google.com/android`) to your environment's **network egress allowlist**, then ask the
session to install the Android SDK and run the Gradle build. Without that allowlist entry
the SDK download fails with `Host not in allowlist: dl.google.com`.

---

## App identifiers

- **Package name:** `com.govdao.app`
- **Version:** `0.1.0` (`versionCode` 1) — bump `version` + `android.versionCode` in
  `apps/mobile/app.json` for each release.

## Store assets (already generated in the repo)

- App icon, adaptive icon, splash: `apps/mobile/assets/`
- Feature graphic (1024×500): `apps/mobile/assets/feature-graphic.png`
- Phone screenshots (1080×1920): `config/play-store/screenshots/`
- Listing copy, data-safety, content-rating: `config/play-store/*.md`
