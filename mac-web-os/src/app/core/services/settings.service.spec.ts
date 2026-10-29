import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';
import { DEFAULT_SETTINGS } from '../models/settings.model';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
  });

  it('starts from the default settings when nothing is persisted yet', () => {
    expect(service.settings()).toEqual(DEFAULT_SETTINGS);
  });

  it('update() patches only the given fields and persists them', () => {
    service.update({ wallpaperId: 'sierra', dockSize: 70 });
    expect(service.settings().wallpaperId).toBe('sierra');
    expect(service.settings().dockSize).toBe(70);
    expect(service.settings().theme).toBe(DEFAULT_SETTINGS.theme);
  });

  it('toggleTheme flips between light and dark', () => {
    expect(service.theme()).toBe('light');
    service.toggleTheme();
    expect(service.theme()).toBe('dark');
    service.toggleTheme();
    expect(service.theme()).toBe('light');
  });

  it('resetToDefaults() restores every field back to DEFAULT_SETTINGS', () => {
    service.update({ theme: 'dark', accent: 'pink', dockSize: 90, volume: 10 });
    service.resetToDefaults();
    expect(service.settings()).toEqual(DEFAULT_SETTINGS);
  });

  it('accentOptions() exposes a hex value for every accent color', () => {
    const options = service.accentOptions();
    expect(options.length).toBeGreaterThan(0);
    for (const opt of options) {
      expect(opt.hex).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('persists settings across service instances via StorageService/localStorage', () => {
    service.update({ accent: 'green', use24HourClock: false });
    TestBed.flushEffects();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const second = TestBed.inject(SettingsService);
    expect(second.settings().accent).toBe('green');
    expect(second.settings().use24HourClock).toBe(false);
  });
});
