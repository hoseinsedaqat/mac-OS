import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from '../../core/services/storage.service';

const KEY = 'app-store-installed-ids';

const ALL_APP_IDS = [
  'finder',
  'safari',
  'mail',
  'calendar',
  'notes',
  'photos',
  'music',
  'calculator',
  'settings',
  'terminal',
  'app-store',
  'trash',
  'about',
];

/** A couple of apps start "not installed" purely to make the install flow demonstrable. */
const DEFAULT_NOT_INSTALLED = new Set(['music', 'terminal']);

@Injectable({ providedIn: 'root' })
export class AppStoreInstallService {
  private readonly storage = inject(StorageService);
  private readonly installedSignal = signal<Set<string>>(this.load());
  readonly installed = this.installedSignal.asReadonly();

  constructor() {}

  private load(): Set<string> {
    const stored = this.storage.getItem<string[] | null>(KEY, null);
    if (stored) return new Set(stored);
    const defaults = ALL_APP_IDS.filter((id) => !DEFAULT_NOT_INSTALLED.has(id));
    return new Set(defaults);
  }

  isInstalled(appId: string): boolean {
    return this.installedSignal().has(appId);
  }

  install(appId: string): void {
    this.installedSignal.update((set) => new Set(set).add(appId));
    this.storage.setItem(KEY, [...this.installedSignal()]);
  }
}
