import { TestBed } from '@angular/core/testing';
import { AppStoreInstallService } from './app-store-install.service';

describe('AppStoreInstallService', () => {
  let service: AppStoreInstallService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppStoreInstallService);
  });

  it('marks most apps as installed by default, but a couple as installable demos', () => {
    expect(service.isInstalled('finder')).toBe(true);
    expect(service.isInstalled('music')).toBe(false);
    expect(service.isInstalled('terminal')).toBe(false);
  });

  it('install() flips an app to installed and persists it', () => {
    expect(service.isInstalled('music')).toBe(false);
    service.install('music');
    expect(service.isInstalled('music')).toBe(true);
  });

  it('persists installed state across service instances', () => {
    service.install('terminal');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const second = TestBed.inject(AppStoreInstallService);
    expect(second.isInstalled('terminal')).toBe(true);
  });
});
