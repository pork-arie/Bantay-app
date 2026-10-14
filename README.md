# Bantay

**Offline point-of-sale, inventory and utang tracker for sari-sari stores.**

Bantay ("to watch over") helps small Filipino stores sell, track stock and credit, and
keep honest records — all on the owner's phone, with no Wi-Fi, account or server needed.

## Features

- **Benta (POS):** tap or scan to sell, tingi (per piece) and pack/tali prices, Cash /
  GCash / Utang, change (sukli) computation, credit-limit warnings.
- **Receipts:** numbered receipts with exact time, print (58 mm) or share as PDF,
  void with reason (owner PIN), "not an official receipt" notice.
- **Inventory:** stock in pieces and packs, low-stock alerts, "days left" estimates,
  restock by pack, shareable shopping list, barcode scanning with online name lookup.
- **Utang:** customer ledgers, cash or GCash payments, credit limits, reminder messages,
  printable credit list.
- **Reports:** sales and profit by day/week/month, payment split, best sellers, earnings
  forecast, profit calculator, end-of-day cash count, month/day sales history.
- **Bantay mode:** owner and staff PINs, staff restrictions (no profit, inventory or settings), auto-lock after 5 minutes in the background, activity log of every action.
- **Offline backup:** one-file backup and restore (Bluetooth, SD card, Messenger…),
  backup reminders.
- **Personalization:** light (default) or dark mode, 8 accent colors, Filipino, English or Waray-Waray.

## Tech

Expo SDK 57 · React Native · Expo Router · TypeScript · expo-sqlite (on-device storage) ·
expo-camera (barcodes) · expo-print / expo-sharing (receipts, backups) ·
Open Food Facts (optional product lookup).

## Run it

```bash
npm install
npx expo start          # Expo Go: everything except the barcode camera
npx expo run:android    # development build with camera, print and file sharing
```

## Privacy & legal

All data stays on the device; the developer collects nothing. See
[Privacy Policy](docs/privacy-policy.md), [Terms of Use](docs/terms-of-use.md) and the
[store release checklist](docs/store-release-checklist.md) (Google Play Data safety,
App Store privacy, BIR and Data Privacy Act notes). The same text is in the app under
**Privacy & Terms**.
