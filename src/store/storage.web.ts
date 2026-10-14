// Web: SQLite needs extra WebAssembly setup, so the browser build uses localStorage.
export async function loadItem(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function saveItem(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode); the app still works in memory.
  }
}
