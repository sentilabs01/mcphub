export function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn('[safeLocal] setItem failed, retrying once', err);
    try {
      localStorage.setItem(key, value);
    } catch (err2) {
      console.error('[safeLocal] setItem failed twice, giving up', err2);
    }
  }
}

export function safeGet(key: string, fallback: string = ''): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (err) {
    console.warn('[safeLocal] getItem failed', err);
    return fallback;
  }
}

export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('[safeLocal] removeItem failed', err);
  }
} 