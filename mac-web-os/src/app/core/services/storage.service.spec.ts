import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  it('returns the provided fallback when a key does not exist yet', () => {
    expect(service.getItem('missing-key', 'fallback')).toBe('fallback');
    expect(service.getItem('missing-object', { a: 1 })).toEqual({ a: 1 });
  });

  it('round-trips JSON-serializable values through set/get', () => {
    service.setItem('prefs', { theme: 'dark', volume: 42 });
    expect(service.getItem('prefs', null)).toEqual({ theme: 'dark', volume: 42 });
  });

  it('namespaces its keys so it never collides with unrelated localStorage entries', () => {
    service.setItem('settings', { x: 1 });
    const rawKeys = Object.keys(window.localStorage);
    expect(rawKeys.some((k) => k.includes('macweb-os'))).toBe(true);
    expect(window.localStorage.getItem('settings')).toBeNull();
  });

  it('removeItem deletes a key so a subsequent read falls back to default', () => {
    service.setItem('temp', 'value');
    service.removeItem('temp');
    expect(service.getItem('temp', 'default')).toBe('default');
  });

  it('clearAll wipes every namespaced key without touching unrelated localStorage entries', () => {
    window.localStorage.setItem('unrelated-app-key', 'keep-me');
    service.setItem('a', 1);
    service.setItem('b', 2);
    service.clearAll();
    expect(service.getItem('a', null)).toBeNull();
    expect(service.getItem('b', null)).toBeNull();
    expect(window.localStorage.getItem('unrelated-app-key')).toBe('keep-me');
  });

  it('exportAll returns every namespaced key with its parsed value, without the namespace prefix', () => {
    window.localStorage.setItem('unrelated-app-key', 'keep-me');
    service.setItem('settings', { theme: 'dark' });
    service.setItem('notes', [{ id: '1', title: 'Hi' }]);
    const exported = service.exportAll();
    expect(exported).toEqual({
      settings: { theme: 'dark' },
      notes: [{ id: '1', title: 'Hi' }],
    });
  });

  it('importAll writes every key from a snapshot back into storage', () => {
    service.importAll({ settings: { theme: 'light' }, notes: [{ id: '2' }] });
    expect(service.getItem('settings', null)).toEqual({ theme: 'light' });
    expect(service.getItem('notes', null)).toEqual([{ id: '2' }]);
  });

  it('exportAll -> importAll round-trips a full snapshot into a genuinely separate service instance', () => {
    service.setItem('settings', { theme: 'dark', volume: 7 });
    service.setItem('notes', [{ id: 'n1', title: 'Note' }]);
    const snapshot = service.exportAll();

    window.localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(StorageService);
    expect(fresh.getItem('settings', null)).toBeNull(); // confirms this really is a fresh instance/store

    fresh.importAll(snapshot);

    expect(fresh.getItem('settings', null)).toEqual({ theme: 'dark', volume: 7 });
    expect(fresh.getItem('notes', null)).toEqual([{ id: 'n1', title: 'Note' }]);
  });

  it('falls back to an in-memory value and flags storageDegraded when localStorage.setItem throws', () => {
    const proto = Object.getPrototypeOf(window.localStorage) as Storage;
    const spy = vi.spyOn(proto, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(service.storageDegraded()).toBe(false);
    const ok = service.setItem('will-fail', { large: true });
    expect(ok).toBe(false);
    expect(service.storageDegraded()).toBe(true);
    expect(service.getItem('will-fail', null)).toEqual({ large: true });
    spy.mockRestore();
  });
});
