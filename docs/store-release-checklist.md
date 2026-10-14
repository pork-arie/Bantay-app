# Store release checklist (Google Play & App Store)

Use this before publishing Bantay. It is a practical guide, not legal advice — have a
lawyer review the Privacy Policy and Terms if you plan to sell or widely distribute the app.

## 1. Fill in your details

- [ ] `src/legal/content.ts`: set `DEVELOPER` (your name or business) and `CONTACT_EMAIL`.
- [ ] Re-generate `docs/privacy-policy.md` and `docs/terms-of-use.md` if you edit the text
      (or edit them by hand to match).
- [ ] `app.json`: `ios.bundleIdentifier` and `android.package` are set to
      `com.porkarie.bantay`. Change them now if you want something else — they **cannot be
      changed** after the first store upload.

## 2. Host the Privacy Policy (both stores require a public URL)

Free option: GitHub Pages.

1. Repo → Settings → Pages → Source: **Deploy from a branch** → branch `main`, folder `/docs`.
2. Your links become:
   - `https://pork-arie.github.io/Bantay-app/privacy-policy`
   - `https://pork-arie.github.io/Bantay-app/terms-of-use`
3. Paste the privacy link into Google Play Console and App Store Connect.

## 3. Google Play — Data safety form

| Question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | **No** — all data stays on the device; nothing is sent to the developer. |
| Is all user data encrypted in transit? | Not applicable (no user data is transmitted). The only network request is a barcode number to Open Food Facts over HTTPS. Data on the device is encrypted with AES-256-GCM. |
| Do you provide a way for users to request that their data is deleted? | **Yes** — Profile & Settings → "Burahin lahat ng data", or uninstall. |

Other Play Console items:

- **Permissions:** Camera only — "Used to scan product barcodes." Microphone is blocked in `app.json`.
- **Target audience:** 18+ / business users. Not designed for children.
- **Ads:** No ads.
- **App category:** Business (or Productivity).
- **Content rating questionnaire:** no violence, gambling, user-generated public content, etc.

## 4. App Store — App Privacy ("nutrition label")

- **Data collection:** choose **"Data Not Collected"**. (Data entered by the user that never
  leaves the device does not count as "collected" under Apple's definition.)
- **Privacy manifest:** included in `app.json` → `ios.privacyManifests` (no tracking, no
  collected data types, required-reason APIs declared). Expo packages add their own.
- **Encryption export:** Bantay uses standard AES-256-GCM (from expo-crypto) only to protect its
  own data on the device and in password-protected backups, plus HTTPS. Apps that use
  standard encryption only for this kind of data protection usually qualify for an exemption,
  and `app.json` sets `ITSAppUsesNonExemptEncryption = false` on that basis. **Confirm this
  when App Store Connect asks the export-compliance questions**, and change the flag if your
  answers say otherwise.
- **Camera usage text:** "Bantay uses the camera to scan product barcodes."

## 5. Philippines-specific reminders

- **Data Privacy Act of 2012 (RA 10173):** the app stores customer names, numbers and
  balances only on the owner's phone. The Privacy Policy explains that the store owner is
  responsible for that data.
- **BIR:** every receipt says "Hindi ito opisyal na resibo (BIR)". Do not describe the app
  as issuing official receipts in your store listing.
- **GCash:** the Terms state Bantay is not affiliated with GCash/G-Xchange/Mynt. Don't use
  the GCash logo in screenshots or the app icon.

## 6. Build and submit

```bash
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform android
npx eas-cli@latest submit --platform ios
```

- Android needs a Google Play Developer account (one-time fee).
- iOS needs an Apple Developer Program membership (yearly fee) and a Mac is **not** required
  when building with EAS.
- Bump `version` (and `ios.buildNumber` / `android.versionCode`) for every new release.
