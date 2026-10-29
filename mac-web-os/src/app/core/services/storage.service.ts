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
