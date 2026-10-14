import { Storage } from 'expo-sqlite/kv-store';

// Native: a key-value store backed by SQLite, so data survives app restarts.
export async function loadItem(key: string) {
  return Storage.getItemAsync(key);
}

export async function saveItem(key: string, value: string) {
  await Storage.setItemAsync(key, value);
}
