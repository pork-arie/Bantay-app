import { AESEncryptionKey } from 'expo-crypto';

const KEY_NAME = 'bantay-data-key';
let cached: Promise<AESEncryptionKey> | null = null;

/**
 * Web preview only: browsers have no Keychain, so the key sits in localStorage.
 * This keeps the code path identical to the phone but is not real protection.
 */
export function getDeviceKey() {
  cached ??= (async () => {
    const saved = window.localStorage.getItem(KEY_NAME);
    if (saved) return AESEncryptionKey.import(saved, 'hex');
    const key = await AESEncryptionKey.generate();
    window.localStorage.setItem(KEY_NAME, await key.encoded('hex'));
    return key;
  })();
  return cached;
}
