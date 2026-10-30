import { Injectable, signal } from '@angular/core';

/**
 * Thin, defensive wrapper around `localStorage`.
 *
 * - Namespaces every key so the simulator never collides with other sites
 *   sharing the same origin during local development.
 * - Never throws: storage can be disabled (private browsing, quota full,
 *   user settings) and the rest of the app must keep working with in-memory
 *   fallbacks in that case.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly namespace = 'macweb-os';
  private readonly memoryFallback = new Map<string, string>();

  /** Flips to true the first time a write fails, so the UI can warn the user once. */
  readonly storageDegraded = signal(false);

  private key(key: string): string {
    return `${this.namespace}:${key}`;
  }

  isAvailable(): boolean {
    try {
      const probeKey = this.key('__probe__');
      window.localStorage.setItem(probeKey, '1');
      window.localStorage.removeItem(probeKey);
      return true;
    } catch {
      return false;
    }
  }

  getItem<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(this.key(key)) ?? this.memoryFallback.get(key) ?? null;
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  setItem<T>(key: string, value: T): boolean {
    const raw = JSON.stringify(value);
    try {
      window.localStorage.setItem(this.key(key), raw);
      this.memoryFallback.set(key, raw);
      return true;
    } catch {
      // Quota exceeded or storage disabled: keep data for this session only.
      this.memoryFallback.set(key, raw);
      this.storageDegraded.set(true);
      return false;
    }
  }

  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(this.key(key));
    } catch {
      /* ignore */
    }
    this.memoryFallback.delete(key);
  }

  /**
   * Returns every namespaced key this app owns, with its namespace prefix
   * stripped and its JSON value parsed back into a plain object. Used to
   * build a full data export (Settings → Storage → Export Data).
   */
  exportAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    if (this.isAvailable()) {
      try {
        for (let i = 0; i < window.localStorage.length; i++) {
          const fullKey = window.localStorage.key(i);
          if (!fullKey || !fullKey.startsWith(`${this.namespace}:`)) continue;
          const raw = window.localStorage.getItem(fullKey);
          if (raw === null) continue;
          try {
            result[fullKey.slice(this.namespace.length + 1)] = JSON.parse(raw);
          } catch {
            // Corrupt entry: skip it rather than failing the whole export.
          }
        }
        return result;
      } catch {
        // Fall through to the in-memory snapshot below.
      }
    }
    for (const [key, raw] of this.memoryFallback) {
      try {
        result[key] = JSON.parse(raw);
      } catch {
        // Corrupt entry: skip it rather than failing the whole export.
      }
    }
    return result;
  }

  /**
   * Restores every key from a snapshot produced by `exportAll()`. Existing
   * keys are overwritten; keys that exist locally but aren't present in
   * `data` are left untouched (callers that want a clean slate should call
   * `clearAll()` first).
   */
  importAll(data: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(data)) {
      this.setItem(key, value);
    }
  }

  /** Clears every key owned by this app (used by "Reset Environment"). */
  clearAll(): void {
    try {
      const toDelete: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(`${this.namespace}:`)) toDelete.push(k);
      }
      toDelete.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    this.memoryFallback.clear();
  }
}
