import { useEffect, useState } from 'react';

const PREFIX = 'acme-cartoon-o-matic:v1:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the machine carries on regardless */
  }
}

/** useState that persists to localStorage under a namespaced key. */
export function usePersistent<T>(key: string, fallback: T | (() => T)) {
  const [value, setValue] = useState<T>(() =>
    load<T>(key, typeof fallback === 'function' ? (fallback as () => T)() : fallback),
  );
  useEffect(() => save(key, value), [key, value]);
  return [value, setValue] as const;
}
