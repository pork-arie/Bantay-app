import { AESEncryptionKey } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEY_NAME = 'bantay-data-key';
let cached: Promise<AESEncryptionKey> | null = null;

/**
 * The AES key that encrypts the store's data on this phone. It is created once
 * and kept in the Android Keystore / iOS Keychain, separate from the data.
 */
export function getDeviceKey() {
  cached ??= (async () => {
    const saved = await SecureStore.getItemAsync(KEY_NAME);
    if (saved) return AESEncryptionKey.import(saved, 'hex');
    const key = await AESEncryptionKey.generate();
    await SecureStore.setItemAsync(KEY_NAME, await key.encoded('hex'));
    return key;
  })();
  return cached;
}
