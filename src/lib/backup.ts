import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
  base64ToBytes,
  bytesToBase64,
  decryptText,
  encryptText,
  KDF_ITERATIONS,
  keyFromPassword,
  randomBytes,
} from '@/lib/crypto';
import type { State } from '@/store/StoreProvider';

const APP_ID = 'bantay';
const FORMAT_VERSION = 2;

type PlainBackup = { app: typeof APP_ID; version: number; exportedAt: string; data: Partial<State> };
/** Password-protected backup: `data` is AES-GCM ciphertext of the JSON state. */
export type EncryptedBackup = {
  app: typeof APP_ID;
  version: number;
  exportedAt: string;
  encrypted: true;
  salt: string;
  iterations: number;
  data: string;
};
type BackupFile = PlainBackup | EncryptedBackup;

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
export async function exportBackup(state: State, password = ''): Promise<boolean> {
  const exportedAt = new Date().toISOString();
  let backup: BackupFile;
  if (password) {
    const salt = randomBytes(16);
    const key = await keyFromPassword(password, salt);
    backup = {
      app: APP_ID,
      version: FORMAT_VERSION,
      exportedAt,
      encrypted: true,
      salt: bytesToBase64(salt),
      iterations: KDF_ITERATIONS,
      data: await encryptText(JSON.stringify(state), key),
    };
  } else {
    backup = { app: APP_ID, version: FORMAT_VERSION, exportedAt, data: state };
  }
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
  | { ok: true; locked: EncryptedBackup; exportedAt: string }
  | { ok: false; reason: 'canceled' | 'invalid' };

function isValidState(data: Partial<State> | undefined): data is Partial<State> {
  return (
    data !== undefined && Array.isArray(data.products) && Array.isArray(data.sales) && Array.isArray(data.debtors)
  );
}

/** Opens a password-protected backup. Resolves to null if the password is wrong. */
export async function unlockBackup(backup: EncryptedBackup, password: string): Promise<Partial<State> | null> {
  try {
    const key = await keyFromPassword(password, base64ToBytes(backup.salt), backup.iterations);
    const data = JSON.parse(await decryptText(backup.data, key)) as Partial<State>;
    return isValidState(data) ? data : null;
  } catch {
    return null;
  }
}

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
    if (parsed.app !== APP_ID) return { ok: false, reason: 'invalid' };
    if ('encrypted' in parsed && parsed.encrypted) {
      const locked = parsed as EncryptedBackup;
      if (typeof locked.data !== 'string' || typeof locked.salt !== 'string') return { ok: false, reason: 'invalid' };
      return { ok: true, locked, exportedAt: locked.exportedAt ?? '' };
    }
    const data = (parsed as PlainBackup).data;
    if (!isValidState(data)) return { ok: false, reason: 'invalid' };
    return { ok: true, data, exportedAt: parsed.exportedAt ?? '' };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

/** Whole days since the last backup, or null if there has never been one. */
export function daysSinceBackup(lastBackupAt?: string) {
  if (!lastBackupAt) return null;
  return Math.floor((Date.now() - new Date(lastBackupAt).getTime()) / (24 * 60 * 60 * 1000));
}
