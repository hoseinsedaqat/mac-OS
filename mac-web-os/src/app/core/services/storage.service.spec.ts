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
