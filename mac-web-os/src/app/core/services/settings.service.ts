import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { AccentColor, DEFAULT_SETTINGS, SettingsState, ThemeMode } from '../models/settings.model';

const STORAGE_KEY = 'settings';

const ACCENT_VALUES: Record<AccentColor, string> = {
  blue: '#0a84ff',
  purple: '#a855f7',
  pink: '#ff375f',
  red: '#ff453a',
  orange: '#ff9f0a',
  yellow: '#ffd60a',
  green: '#32d74b',
  graphite: '#8e8e93',
};

/**
 * Central settings store. Every piece of UI that needs to react to a
 * preference change (wallpaper, theme, dock size, clock format, ...) reads
 * from the signals exposed here instead of keeping its own copy.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly storage = inject(StorageService);
  private readonly state = signal<SettingsState>(this.loadInitial());

  readonly settings = this.state.asReadonly();
  readonly theme = computed<ThemeMode>(() => this.state().theme);
  readonly accent = computed<AccentColor>(() => this.state().accent);
  readonly accentHex = computed(() => ACCENT_VALUES[this.accent()]);
  readonly wallpaperId = computed(() => this.state().wallpaperId);
  readonly reduceMotion = computed(() => this.state().reduceMotion);

  constructor() {
    effect(() => {
      this.storage.setItem(STORAGE_KEY, this.state());
    });

    effect(() => {
      const root = document.documentElement;
      root.classList.toggle('theme-dark', this.theme() === 'dark');
      root.classList.toggle('theme-light', this.theme() === 'light');
      root.style.setProperty('--mw-accent', ACCENT_VALUES[this.accent()]);
      root.classList.toggle('reduce-motion', this.reduceMotion());
    });
  }

  private loadInitial(): SettingsState {
    const stored = this.storage.getItem<SettingsState>(STORAGE_KEY, DEFAULT_SETTINGS);
    if (stored.version !== DEFAULT_SETTINGS.version) {
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  update(patch: Partial<SettingsState>): void {
    this.state.update((current) => ({ ...current, ...patch }));
  }

  toggleTheme(): void {
    this.update({ theme: this.theme() === 'dark' ? 'light' : 'dark' });
  }

  resetToDefaults(): void {
    this.state.set({ ...DEFAULT_SETTINGS });
  }

  accentOptions(): { id: AccentColor; hex: string }[] {
    return (Object.keys(ACCENT_VALUES) as AccentColor[]).map((id) => ({ id, hex: ACCENT_VALUES[id] }));
  }
}
