import { Injectable, computed, effect, inject } from '@angular/core';
import { SettingsService } from './settings.service';
import { en, Translations } from '../i18n/en';
import { fa } from '../i18n/fa';
import { AppLanguage } from '../models/settings.model';

const DICTIONARIES: Record<AppLanguage, Translations> = { en, fa };

/**
 * Central translation service. English (`en`) is the primary/default
 * language; Persian (`fa`) is a fully supported secondary language the user
 * can switch to from Settings (or the Control Center). The current language
 * is backed by `SettingsService` so it persists like every other preference.
 *
 * Every component reads strings through `i18n.t(...)`, which reads the
 * `language` signal internally — because that read happens synchronously
 * while Angular evaluates a template binding, the owning OnPush component is
 * automatically re-rendered whenever the language changes, with no manual
 * subscriptions needed.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly settings = inject(SettingsService);

  readonly language = computed<AppLanguage>(() => this.settings.settings().language);
  readonly isRtl = computed(() => this.language() === 'fa');
  readonly dir = computed<'ltr' | 'rtl'>(() => (this.isRtl() ? 'rtl' : 'ltr'));

  constructor() {
    effect(() => {
      const root = document.documentElement;
      root.lang = this.language();
      root.dir = this.dir();
    });
  }

  setLanguage(language: AppLanguage): void {
    this.settings.update({ language });
  }

  toggleLanguage(): void {
    this.setLanguage(this.language() === 'en' ? 'fa' : 'en');
  }

  private dict(): Translations {
    return DICTIONARIES[this.language()];
  }

  /**
   * Resolves a dot-separated path (e.g. `"apps.finder.emptyFolder"`) against
   * the current language's dictionary. If the resolved value is a function
   * (used for strings that interpolate a value, e.g. a file name), it is
   * invoked with `args`. Falls back to the raw key if the path is invalid,
   * so a typo never crashes the UI — it just shows an obviously-wrong label
   * during development.
   */
  t(path: string, ...args: unknown[]): string {
    const value = this.resolve(this.dict(), path) ?? this.resolve(en as unknown as Translations, path);
    if (typeof value === 'function') {
      return (value as (...a: unknown[]) => string)(...args);
    }
    if (typeof value === 'string') return value;
    return path;
  }

  /** Resolves a path to a raw array (e.g. weekday abbreviations or boot step lists). */
  list(path: string): string[] {
    const value = this.resolve(this.dict(), path) ?? this.resolve(en as unknown as Translations, path);
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
