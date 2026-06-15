# Push Notifications

GOVDAO uses `expo-notifications` to deliver governance alerts (votes opening/closing,
treasury activity, guardian events). Wiring is gated on `features.pushNotifications` in
the manifest.

## How it's wired

- **`usePushNotifications`** — requests permission, registers Android notification
  channels (governance, guardian, and — when enabled — votes/treasury), and fetches the
  Expo push token. Exposes `{ state, register }`.
- **`PushStatusCard`** in Settings — shows permission status + (truncated) token and an
  "Enable governance alerts" button.
- **Foreground handler** surfaces notifications as a banner with sound.
- **Platform split** — the native SDK is imported only by
  `usePushNotifications.native.ts`; the web/default file is a no-op, so the web bundle
  never imports `expo-notifications` (verified: 0 SDK symbols in the web export).

## Getting a push token

`getExpoPushTokenAsync` needs an **EAS projectId**. In a build created with
`eas build`, the projectId is injected automatically and registration returns a token.
If it's missing, the card reports that clearly instead of failing silently.

To send a test notification to a registered device, POST its Expo push token to
`https://exp.host/--/api/v2/push/send`:

```bash
curl -H 'Content-Type: application/json' -X POST https://exp.host/--/api/v2/push/send -d '{
  "to": "ExponentPushToken[...]",
  "title": "Proposal GOV-12 is now open",
  "body": "Voting closes in 18h — cast your ballot."
}'
```

## Building with push

Push requires a native build (not Expo Go for production, not web):

```bash
cd apps/mobile
npx expo prebuild --platform android   # applies the expo-notifications config plugin
eas build -p android --profile production
```
