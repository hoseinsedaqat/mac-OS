import { TestBed } from '@angular/core/testing';
import { DataPortabilityService } from './data-portability.service';
import { StorageService } from './storage.service';
import { FileSystemService } from './file-system.service';
import { EXPORT_BUNDLE_APP_ID, EXPORT_BUNDLE_SCHEMA_VERSION } from '../models/export-bundle.model';

describe('DataPortabilityService', () => {
  let service: DataPortabilityService;
  let storage: StorageService;
  let fs: FileSystemService;

  beforeEach(async () => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataPortabilityService);
    storage = TestBed.inject(StorageService);
    fs = TestBed.inject(FileSystemService);
    await fs.init();
  });

  it('buildExport() bundles localStorage and the file system under a versioned, app-tagged envelope', () => {
    storage.setItem('settings', { theme: 'dark' });
    const bundle = service.buildExport();
    expect(bundle.app).toBe(EXPORT_BUNDLE_APP_ID);
    expect(bundle.schemaVersion).toBe(EXPORT_BUNDLE_SCHEMA_VERSION);
    expect(typeof bundle.exportedAt).toBe('string');
    expect(bundle.localStorage['settings']).toEqual({ theme: 'dark' });
    expect(bundle.fileSystem.length).toBeGreaterThan(0);
  });

  it('parseBundle() accepts a well-formed bundle and rejects malformed or unrelated JSON', () => {
    const bundle = service.buildExport();
    expect(service.parseBundle(JSON.stringify(bundle))).toEqual(bundle);

    expect(service.parseBundle('not json')).toBeNull();
    expect(service.parseBundle(JSON.stringify({ hello: 'world' }))).toBeNull();
    expect(service.parseBundle(JSON.stringify({ ...bundle, app: 'some-other-app' }))).toBeNull();
    expect(service.parseBundle(JSON.stringify({ ...bundle, schemaVersion: 999 }))).toBeNull();
    expect(service.parseBundle(JSON.stringify({ ...bundle, fileSystem: 'not-an-array' }))).toBeNull();
  });

  it('importBundle() restores localStorage keys and the file system, then reloads the page', async () => {
    storage.setItem('settings', { theme: 'dark' });
    await fs.createFile((fs.exportAll().find((n) => n.name === 'Documents') ?? fs.exportAll()[0]).id, 'keepme.txt', 'hi');
    const bundle = service.buildExport();

    const reloadSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: reloadSpy },
    });

    window.localStorage.clear();
    storage.importAll({}); // no-op, just confirming the API shape doesn't throw on empty input

    await service.importBundle(bundle);

    expect(storage.getItem('settings', null)).toEqual({ theme: 'dark' });
    expect(fs.nodes().some((n) => n.name === 'keepme.txt')).toBe(true);
    expect(reloadSpy).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });
});
