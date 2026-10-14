// Legal text shown in the app (Legal screen) and mirrored in docs/*.md for the
// App Store / Google Play listing. Keep both in sync when you edit.
//
// This is a starting point written for a local-only app, not legal advice.
// Fill in DEVELOPER and CONTACT_EMAIL, and have a lawyer review before publishing.

export const DEVELOPER = 'Bantay app developer';
export const CONTACT_EMAIL = 'your-email@example.com';
export const LAST_UPDATED = 'October 15, 2026';

export type LegalDoc = {
  title: string;
  /** Short plain-language summary in Filipino, shown above the full text. */
  summary: string;
  sections: { heading: string; body: string[] }[];
};

export const PRIVACY: LegalDoc = {
  title: 'Privacy Policy',
  summary:
    'Sa madaling salita: lahat ng inilalagay mo sa Bantay ay naka-save lang sa phone mo. Wala kaming kinukuha, walang account, walang ads at walang tracking. Ikaw, bilang may-ari ng tindahan, ang responsable sa impormasyon ng mga customer mo (pangalan, numero, utang) ayon sa Data Privacy Act of 2012.',
  sections: [
    {
      heading: 'Who we are',
      body: [
        `Bantay is a point-of-sale and inventory app for small stores, made by ${DEVELOPER}. In this policy, "we" means the developer and "you" means the store owner or staff using the app.`,
      ],
    },
    {
      heading: 'Your data stays on your phone',
      body: [
        'Everything you enter is saved only on your device. We do not run servers for Bantay, we do not have accounts, and we do not receive, sell or share your data.',
        'Bantay has no advertising, no analytics and no tracking.',
      ],
    },
    {
      heading: 'What the app stores on your device',
      body: [
        'Store profile: store name, address, your name and mobile number, GCash number.',
        'Products, prices, stock, barcodes and sales records, including the time of each sale and who made it.',
        'Customer credit (utang): customer names, mobile numbers, balances and payment history that you choose to record.',
        'Staff names and PINs, and an activity log of actions in the app.',
      ],
    },
    {
      heading: 'Customer information and the Data Privacy Act',
      body: [
        "Customer names, numbers and balances are personal information. Under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173), you as the store owner decide what to record and are responsible for it. We never receive this information.",
        'Please only record what you need, tell customers you keep a record of their utang, keep it accurate, delete it when a customer asks or when it is no longer needed, and keep your phone and backup files secure.',
      ],
    },
    {
      heading: 'Internet use',
      body: [
        'Bantay works fully offline. The only time it contacts the internet on its own is when you add a product by barcode: it sends only the barcode number to Open Food Facts (openfoodfacts.org) to look up the product name. No personal information is sent. If you are offline, this step is skipped.',
        'When you share a receipt, a report or a backup file, you choose where it goes (for example Messenger, email or Bluetooth). That app or service then handles it under its own privacy policy.',
      ],
    },
    {
      heading: 'Camera',
      body: [
        'The camera is used only to read barcodes while the scanner is open. Bantay does not take, save or send photos.',
      ],
    },
    {
      heading: 'Backups',
      body: [
        'A backup file contains all of your store data, including customer information. If you set a backup password, the file is encrypted (AES-256-GCM) and cannot be opened without that password; the password cannot be recovered if you forget it. Backups made without a password are not encrypted, so store them somewhere safe and only share them with people you trust.',
      ],
    },
    {
      heading: 'Security',
      body: [
        'Your store data on the phone is encrypted with AES-256-GCM. The encryption key is created on your phone and kept in its secure key storage (Android Keystore or iOS Keychain), separate from the data.',
        "The PIN lock keeps other people from using the app and limits what staff can do. Also protect your phone with its own screen lock: anyone who can unlock the phone and open the app can see the data.",
      ],
    },
    {
      heading: 'Keeping and deleting data',
      body: [
        'Data stays on your phone until you delete it. You can erase everything at any time in Profile & Settings → "Burahin lahat ng data", or by uninstalling the app. Remember to also delete any backup files you made.',
      ],
    },
    {
      heading: 'Children',
      body: ['Bantay is meant for store owners and their staff. It is not directed at children under 13.'],
    },
    {
      heading: 'Changes and contact',
      body: [
        'If this policy changes, the new version will be in the app and on our listing page, with a new date.',
        `Questions: ${CONTACT_EMAIL}`,
      ],
    },
  ],
};

export const TERMS: LegalDoc = {
  title: 'Terms of Use',
  summary:
    'Sa madaling salita: libre mong magagamit ang Bantay para sa tindahan mo. Ang resibo ng app ay HINDI opisyal na resibo ng BIR. Ang mga hula at report ay tantiya lang. Hindi kami konektado sa GCash. Ikaw ang bahala sa backup ng data mo.',
  sections: [
    {
      heading: 'Using Bantay',
      body: [
        'By using Bantay you agree to these terms. You may use the app to run your own store. Do not use it for anything illegal.',
      ],
    },
    {
      heading: 'Receipts are not official receipts',
      body: [
        'Receipts made by Bantay are for your records and your customers\' reference only. They are NOT official receipts or sales invoices under the rules of the Bureau of Internal Revenue (BIR). You are responsible for registering your business and issuing official receipts or invoices when the law requires it.',
      ],
    },
    {
      heading: 'Estimates and reports',
      body: [
        'Profit, forecasts, "days of stock left", change computation and other numbers are calculated from what you enter. They can be wrong if the data is wrong or incomplete. Forecasts are estimates, not promises. Bantay is not accounting, tax or legal advice.',
      ],
    },
    {
      heading: 'GCash and other services',
      body: [
        'Bantay is not affiliated with, endorsed by or sponsored by GCash, G-Xchange Inc., Mynt or any bank or e-wallet. "GCash" is a trademark of its owner and is used only to describe a payment method. Bantay does not process payments: it only records what you type. Always confirm in your GCash app that a payment arrived.',
        'Product names looked up by barcode come from Open Food Facts, a free database made by volunteers. They may be missing or wrong; please check them.',
      ],
    },
    {
      heading: 'Your data and backups',
      body: [
        'Your data is stored only on your device. You are responsible for keeping your phone secure and for making backups. We cannot recover data that was lost, deleted or stored on a lost phone.',
      ],
    },
    {
      heading: 'No warranty',
      body: [
        'Bantay is provided "as is", without warranties of any kind. We do our best to make it reliable but cannot promise it will be error-free or always available.',
      ],
    },
    {
      heading: 'Limitation of liability',
      body: [
        'To the extent allowed by law, we are not liable for lost profits, lost data, cash shortages, disputes with customers, tax penalties or other indirect losses arising from use of the app.',
      ],
    },
    {
      heading: 'Governing law, changes and contact',
      body: [
        'These terms are governed by the laws of the Republic of the Philippines.',
        'We may update these terms; the new version will show a new date. Continuing to use the app means you accept the update.',
        `Questions: ${CONTACT_EMAIL}`,
      ],
    },
  ],
};

export const NOTICES: LegalDoc = {
  title: 'Notices & Credits',
  summary: 'Mga kredito sa mga ginamit na serbisyo at open-source na software.',
  sections: [
    {
      heading: 'Open Food Facts',
      body: [
        'Product information found by barcode comes from Open Food Facts (openfoodfacts.org), © Open Food Facts contributors, available under the Open Database License (ODbL).',
      ],
    },
    {
      heading: 'Open-source software',
      body: [
        'Bantay is built with Expo and React Native (MIT License), Expo Router, React Navigation and Ionicons (MIT License), among other open-source packages. Their licenses are included with the app\'s source code.',
      ],
    },
    {
      heading: 'Trademarks',
      body: [
        'GCash and other product or brand names mentioned in the app belong to their respective owners and are used only to identify them.',
      ],
    },
  ],
};
