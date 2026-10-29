import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  it('is English-only (ltr, no RTL)', () => {
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
});
