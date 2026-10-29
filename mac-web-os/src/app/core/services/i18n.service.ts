import { Injectable, computed } from '@angular/core';
import { en, Translations } from '../i18n/en';

/**
 * Central translation/strings service. MacWeb OS is English-only — this
 * service exists so every component reads user-facing copy through a single
 * `i18n.t(...)` call site (instead of scattering literals everywhere),
 * which keeps strings consistent and easy to audit/update in one place.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly language = computed<'en'>(() => 'en');
  readonly isRtl = computed(() => false);
  readonly dir = computed<'ltr'>(() => 'ltr');

  constructor() {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  }

  /**
   * Resolves a dot-separated path (e.g. `"apps.finder.emptyFolder"`) against
   * the English dictionary. If the resolved value is a function (used for
   * strings that interpolate a value, e.g. a file name), it is invoked with
   * `args`. Falls back to the raw key if the path is invalid, so a typo
   * never crashes the UI — it just shows an obviously-wrong label during
   * development.
   */
  t(path: string, ...args: unknown[]): string {
    const value = this.resolve(en as unknown as Translations, path);
    if (typeof value === 'function') {
      return (value as (...a: unknown[]) => string)(...args);
    }
    if (typeof value === 'string') return value;
    return path;
  }

  /** Resolves a path to a raw array (e.g. weekday abbreviations or boot step lists). */
  list(path: string): string[] {
    const value = this.resolve(en as unknown as Translations, path);
    return Array.isArray(value) ? value : [];
  }

  private resolve(dict: Translations, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, segment) => {
      if (acc && typeof acc === 'object' && segment in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[segment];
      }
      return undefined;
    }, dict);
  }
}
