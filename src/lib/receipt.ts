import { Platform, Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { peso } from '@/constants/theme';
import type { Sale, Settings } from '@/data/sample';
import { PAYMENT_KEYS, type TKey, type TVars } from '@/i18n';
import { formatDate } from '@/store/selectors';

type T = (key: TKey, vars?: TVars) => string;

/** "#000123"; older sales without a number fall back to part of their id. */
export function receiptLabel(sale: Sale) {
  return sale.receiptNo !== undefined
    ? `#${String(sale.receiptNo).padStart(6, '0')}`
    : `#${sale.id.slice(-6).toUpperCase()}`;
}

/** Full date and time with seconds, for proof of when a sale happened. */
export function receiptDateTime(sale: Sale, settings: Settings) {
  const d = new Date(sale.date);
  const time = d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  return `${formatDate(sale.date, settings.language)} ${d.getFullYear()} · ${time}`;
}

/** Plain-text receipt for Messenger/SMS. */
export function receiptText(sale: Sale, settings: Settings, t: T) {
  return [
    settings.storeName || 'Bantay Store',
    ...(settings.storeAddress ? [settings.storeAddress] : []),
    ...(settings.ownerPhone ? [settings.ownerPhone] : []),
    `${t('Resibo')} ${receiptLabel(sale)}`,
    receiptDateTime(sale, settings),
    '------------------------',
    ...sale.items.map((it) => `${it.qty} ${it.unitName} ${it.name}  ${peso(it.price * it.qty)}`),
    '------------------------',
    `TOTAL: ${peso(sale.total)}`,
    `${t('Bayad')}: ${t(PAYMENT_KEYS[sale.payment])}`,
    ...(sale.cashReceived !== undefined
      ? [`${t('Natanggap')}: ${peso(sale.cashReceived)}`, `${t('Sukli')}: ${peso(sale.cashReceived - sale.total)}`]
      : []),
    ...(sale.gcashRef ? [`GCash Ref: ${sale.gcashRef}`] : []),
    ...(sale.customerName ? [`${t('Customer')}: ${sale.customerName}`] : []),
    '',
    t('Salamat po! 🙏'),
  ].join('\n');
}

function escape(text: string) {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

// 58 mm thermal paper is about 164 points wide at 72 points per inch.
const PAPER_WIDTH = 164;

/** Receipt as HTML sized for 58 mm receipt paper. */
function receiptHtml(sale: Sale, settings: Settings, t: T) {
  const row = (left: string, right: string, bold = false) =>
    `<tr${bold ? ' class="b"' : ''}><td>${escape(left)}</td><td class="r">${escape(right)}</td></tr>`;
  const extra = [
    ...(sale.cashReceived !== undefined
      ? [row(t('Natanggap'), peso(sale.cashReceived)), row(t('Sukli'), peso(sale.cashReceived - sale.total))]
      : []),
    ...(sale.gcashRef ? [row('GCash Ref', sale.gcashRef)] : []),
    ...(sale.customerName ? [row(t('Customer'), sale.customerName)] : []),
  ].join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { margin: 6px; }
    body { font-family: monospace; font-size: 9px; width: ${PAPER_WIDTH - 12}px; margin: 0; color: #000; }
    .c { text-align: center; } .r { text-align: right; } .b td { font-weight: bold; }
    h1 { font-size: 12px; margin: 0 0 2px; }
    table { width: 100%; border-collapse: collapse; }
    td { vertical-align: top; padding: 1px 0; }
    hr { border: 0; border-top: 1px dashed #000; margin: 4px 0; }
  </style></head><body>
    <div class="c">
      <h1>${escape(settings.storeName || 'Bantay Store')}</h1>
      ${settings.storeAddress ? `<div>${escape(settings.storeAddress)}</div>` : ''}
      ${settings.ownerPhone ? `<div>${escape(settings.ownerPhone)}</div>` : ''}
      <div>${escape(`${t('Resibo')} ${receiptLabel(sale)}`)}</div>
      <div>${escape(receiptDateTime(sale, settings))}</div>
    </div>
    <hr>
    <table>${sale.items
      .map(
        (it) =>
          `<tr><td colspan="2">${escape(it.name)}</td></tr>` +
          row(`  ${it.qty} ${it.unitName} × ${peso(it.price)}`, peso(it.price * it.qty)),
      )
      .join('')}</table>
    <hr>
    <table>
      ${row('TOTAL', peso(sale.total), true)}
      ${row(t('Bayad'), t(PAYMENT_KEYS[sale.payment]))}
      ${extra}
    </table>
    <hr>
    <div class="c">${escape(t('Salamat po! 🙏'))}</div>
  </body></html>`;
}

function pageSize(sale: Sale) {
  // Tall enough for the header, every item (two lines each) and the totals.
  return { width: PAPER_WIDTH, height: 190 + sale.items.length * 26 };
}

/** Opens the phone's print dialog (Wi-Fi printers, or Bluetooth ones through a print-service app). */
export async function printReceipt(sale: Sale, settings: Settings, t: T) {
  const html = receiptHtml(sale, settings, t);
  if (Platform.OS === 'web') {
    // expo-print on web prints the whole page, so print just the receipt from a hidden frame.
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    frame.srcdoc = html;
    frame.onload = () => {
      frame.contentWindow?.print();
      setTimeout(() => frame.remove(), 1000);
    };
    document.body.appendChild(frame);
    return;
  }
  await Print.printAsync({ html, ...pageSize(sale) });
}

/** Saves the receipt as a PDF and opens the share menu; falls back to text where PDFs can't be made. */
export async function shareReceipt(sale: Sale, settings: Settings, t: T) {
  if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
    const { uri } = await Print.printToFileAsync({ html: receiptHtml(sale, settings, t), ...pageSize(sale) });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: `${t('Resibo')} ${receiptLabel(sale)}`,
    });
    return;
  }
  await Share.share({ message: receiptText(sale, settings, t) });
}
