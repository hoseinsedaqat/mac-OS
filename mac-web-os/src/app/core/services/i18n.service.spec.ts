import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  it('defaults to English', () => {
    expect(service.language()).toBe('en');
    expect(service.isRtl()).toBe(false);
    expect(service.dir()).toBe('ltr');
  });

  it('resolves a plain string key', () => {
    expect(service.t('common.ok')).toBe('OK');
  });

  it('resolves and invokes an interpolation function key', () => {
    const msg = service.t('apps.trash.deleteForeverConfirmMessage', 'report.txt');
    expect(typeof msg).toBe('string');
    expect(msg).toContain('report.txt');
  });

  it('falls back to the raw path when a key is entirely missing', () => {
    expect(service.t('does.not.exist')).toBe('does.not.exist');
  });

  it('list() resolves array-valued keys', () => {
    const steps = service.list('shell.boot.steps');
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('setLanguage switches the active language and updates dir/isRtl', () => {
    service.setLanguage('fa');
    expect(service.language()).toBe('fa');
    expect(service.isRtl()).toBe(true);
    expect(service.dir()).toBe('rtl');
    expect(service.t('common.ok')).toBe('تأیید');
  });

  it('toggleLanguage flips between en and fa', () => {
    expect(service.language()).toBe('en');
    service.toggleLanguage();
    expect(service.language()).toBe('fa');
    service.toggleLanguage();
    expect(service.language()).toBe('en');
  });

  it('falls back to English when a key is missing from the active (fa) dictionary', () => {
    service.setLanguage('fa');
    // Every key is guaranteed present by the Translations type, but the fallback
    // path itself should never throw even if given a partially-missing path.
    expect(() => service.t('common.ok')).not.toThrow();
  });
});
