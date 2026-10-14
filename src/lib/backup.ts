import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { State } from '@/store/StoreProvider';

const APP_ID = 'bantay';
const FORMAT_VERSION = 1;

type BackupFile = {
  app: typeof APP_ID;
  version: number;
  exportedAt: string;
  data: Partial<State>;
};

function fileName() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `bantay-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

/**
 * Writes all store data to one JSON file and opens the share menu, so the owner can
 * keep it off the phone: Bluetooth/Nearby Share, SD card or USB, or Messenger/email.
 * Resolves to false if the share menu isn't available.
 */
export async function exportBackup(state: State): Promise<boolean> {
  const backup: BackupFile = {
    app: APP_ID,
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  const json = JSON.stringify(backup);

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName();
    link.click();
    URL.revokeObjectURL(url);
    return true;
  }

  if (!(await Sharing.isAvailableAsync())) return false;
  const file = new File(Paths.cache, fileName());
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Bantay backup',
  });
  return true;
}

export type PickResult =
  | { ok: true; data: Partial<State>; exportedAt: string }
  | { ok: false; reason: 'canceled' | 'invalid' };

/** Lets the owner choose a backup file and checks that it really is a Bantay backup. */
export async function pickBackup(): Promise<PickResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return { ok: false, reason: 'canceled' };

  try {
    const asset = result.assets[0];
    const text =
      Platform.OS === 'web'
        ? await (asset.file ? asset.file.text() : fetch(asset.uri).then((r) => r.text()))
        : await new File(asset.uri).text();
    const parsed = JSON.parse(text) as Partial<BackupFile>;
    const data = parsed.data;
    const looksValid =
      parsed.app === APP_ID &&
      data !== undefined &&
      Array.isArray(data.products) &&
      Array.isArray(data.sales) &&
      Array.isArray(data.debtors);
    if (!looksValid) return { ok: false, reason: 'invalid' };
    return { ok: true, data: data!, exportedAt: parsed.exportedAt ?? '' };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

/** Whole days since the last backup, or null if there has never been one. */
export function daysSinceBackup(lastBackupAt?: string) {
  if (!lastBackupAt) return null;
  return Math.floor((Date.now() - new Date(lastBackupAt).getTime()) / (24 * 60 * 60 * 1000));
}
