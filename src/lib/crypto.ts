import * as Crypto from 'expo-crypto';
import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync } from 'expo-crypto';

/**
 * UTF-8 encode/decode written out by hand so it works the same on every JS engine
 * (Hermes doesn't always ship TextDecoder).
 */
export function utf8Encode(text: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let code = text.charCodeAt(i);
    // Combine surrogate pairs (emoji etc.) into one code point.
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const low = text.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00);
        i++;
      }
    }
    if (code < 0x80) out.push(code);
    else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    else if (code < 0x10000) out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    else
      out.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
  }
  return Uint8Array.from(out);
}

export function utf8Decode(bytes: Uint8Array): string {
  const parts: string[] = [];
  let chunk: number[] = [];
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i];
    let code: number;
    if (b < 0x80) {
      code = b;
      i += 1;
    } else if (b < 0xe0) {
      code = ((b & 31) << 6) | (bytes[i + 1] & 63);
      i += 2;
    } else if (b < 0xf0) {
      code = ((b & 15) << 12) | ((bytes[i + 1] & 63) << 6) | (bytes[i + 2] & 63);
      i += 3;
    } else {
      code = ((b & 7) << 18) | ((bytes[i + 1] & 63) << 12) | ((bytes[i + 2] & 63) << 6) | (bytes[i + 3] & 63);
      i += 4;
    }
    if (code > 0xffff) {
      code -= 0x10000;
      chunk.push(0xd800 + (code >> 10), 0xdc00 + (code & 1023));
    } else {
      chunk.push(code);
    }
    // Build the string in pieces; one huge fromCharCode call can overflow the stack.
    if (chunk.length > 8192) {
      parts.push(String.fromCharCode(...chunk));
      chunk = [];
    }
  }
  parts.push(String.fromCharCode(...chunk));
  return parts.join('');
}

export function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToBytes(b64: string) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** AES-256-GCM. Returns IV + ciphertext + tag as one base64 string. */
export async function encryptText(text: string, key: AESEncryptionKey) {
  const sealed = await aesEncryptAsync(utf8Encode(text), key);
  return sealed.combined('base64');
}

/** Throws if the key is wrong or the data was changed (GCM checks integrity). */
export async function decryptText(combinedBase64: string, key: AESEncryptionKey) {
  // Pass bytes, not the base64 string: Android's fromCombined only accepts bytes.
  const sealed = AESSealedData.fromCombined(base64ToBytes(combinedBase64));
  const bytes = (await aesDecryptAsync(sealed, key, { output: 'bytes' })) as Uint8Array;
  return utf8Decode(bytes);
}

export const KDF_ITERATIONS = 20000;

/**
 * Turns a backup password into an AES-256 key by hashing it with a random salt
 * many times (a stretched SHA-256), so guessing passwords is slow.
 * expo-crypto has no PBKDF2; this is the closest built-in option.
 */
export async function keyFromPassword(password: string, salt: Uint8Array, iterations = KDF_ITERATIONS) {
  const secret = utf8Encode(password);
  const block = new Uint8Array(salt.length + secret.length);
  block.set(salt);
  block.set(secret, salt.length);
  let hash = new Uint8Array(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, block));
  const next = new Uint8Array(hash.length + salt.length);
  for (let i = 1; i < iterations; i++) {
    next.set(hash);
    next.set(salt, hash.length);
    hash = new Uint8Array(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, next));
  }
  return AESEncryptionKey.import(hash);
}

export function randomBytes(count: number) {
  return Crypto.getRandomBytes(count);
}
