# Android App Signing — Google Play

To publish GOVDAO to Google Play you sign the app with a private **upload key**.
Google then re-signs it with the **app signing key** it manages (Play App Signing).
This repo gives you everything to create and use the upload key safely — **without
ever committing a secret**.

## TL;DR

```bash
# 1. Generate the upload keystore (writes to ./secrets/, which is gitignored)
KEYSTORE_PASSWORD='choose-a-strong-pass' KEY_PASSWORD='choose-a-strong-pass' \
  bash scripts/generate-keystore.sh

# 2a. Build a signed .aab with EAS using that keystore
cd apps/mobile
cp credentials.json.example credentials.json     # already gitignored
KEYSTORE_PASSWORD='...' KEY_PASSWORD='...' eas build -p android --profile production

# 2b. ...or let EAS manage the key for you (no local keystore needed)
eas build -p android --profile production         # EAS generates & stores the key
```

Upload the resulting `.aab` to Play Console → Production (or Internal testing).

---

## What `scripts/generate-keystore.sh` does

- Runs `keytool -genkeypair` (RSA 2048, 10000-day validity) to create
  `secrets/govdao-upload.keystore` with alias `govdao-upload`.
- Refuses to overwrite an existing keystore (regenerating would lock you out of
  updating an already-published listing).
- Writes `secrets/keystore.properties` for Gradle.
- Prints the **SHA-1 / SHA-256 fingerprints** (needed if you wire up Firebase,
  Google Sign-In, or API key restrictions).

Passwords come from `KEYSTORE_PASSWORD` / `KEY_PASSWORD` env vars (or interactive
prompt). They are never written to a tracked file.

> ⚠️ **Back up `secrets/govdao-upload.keystore` and its passwords.** With Play App
> Signing you *can* reset a lost upload key via Google support, but it's a slow
> manual process — keep an offline copy.

## The three signing paths

### Path 1 — EAS managed credentials (simplest)
Run `eas build -p android --profile production` and answer "yes" when EAS offers to
generate a keystore. EAS stores it server-side; you never handle the file. Best if
you don't need the key locally.

### Path 2 — EAS with your own keystore (this repo's `production` profile)
The `production` profile sets `"credentialsSource": "local"`, so EAS reads
`apps/mobile/credentials.json`. Copy the template and build:

```bash
cd apps/mobile
cp credentials.json.example credentials.json
KEYSTORE_PASSWORD='...' KEY_PASSWORD='...' eas build -p android --profile production
```

`credentials.json` and the keystore are both gitignored.

### Path 3 — Local Gradle release build
After `npx expo prebuild --platform android`, point Gradle at the keystore. Add to
`apps/mobile/android/gradle.properties` (this file is generated, not committed):

```properties
GOVDAO_UPLOAD_STORE_FILE=/abs/path/to/secrets/govdao-upload.keystore
GOVDAO_UPLOAD_KEY_ALIAS=govdao-upload
GOVDAO_UPLOAD_STORE_PASSWORD=...
GOVDAO_UPLOAD_KEY_PASSWORD=...
```

and a `signingConfigs.release` block in `android/app/build.gradle` referencing those
properties. Then:

```bash
cd apps/mobile/android && ./gradlew bundleRelease   # -> app/build/outputs/bundle/release/app-release.aab
```

## Play App Signing (recommended)

When you create the app in Play Console, opt into **Play App Signing**. You upload
with your *upload* key; Google holds the *app signing* key and signs the binary
users download. This means a compromised/lost upload key is recoverable and your
release key never leaves Google.

## Version bumps per release

Update both fields in `apps/mobile/app.json` before each store upload:

```json
"version": "0.2.0",
"android": { "versionCode": 2 }
```

`versionCode` must strictly increase for every upload. The `production` EAS profile
has `autoIncrement: true`, which bumps `versionCode` automatically on EAS builds.
