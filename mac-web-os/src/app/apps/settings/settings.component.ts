import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { StorageService } from '../../core/services/storage.service';
import { DialogService } from '../../core/services/dialog.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { WALLPAPERS } from '../../shared/utils/wallpapers.data';
import { AccentColor, ThemeMode } from '../../core/models/settings.model';

type SettingsSection =
  | 'appearance'
  | 'wallpaper'
  | 'dock'
  | 'desktop'
  | 'sound'
  | 'datetime'
  | 'accessibility'
  | 'storage'
  | 'about';

interface SectionDef {
  id: SettingsSection;
  label: string;
  icon: string;
}

const SECTIONS: SectionDef[] = [
  { id: 'appearance', label: 'Appearance', icon: 'sun' },
  { id: 'wallpaper', label: 'Wallpaper', icon: 'photos' },
  { id: 'dock', label: 'Dock', icon: 'apps' },
  { id: 'desktop', label: 'Desktop', icon: 'grid' },
  { id: 'sound', label: 'Sound', icon: 'volume' },
  { id: 'datetime', label: 'Date & Time', icon: 'calendar' },
  { id: 'accessibility', label: 'Accessibility', icon: 'info' },
  { id: 'storage', label: 'Storage', icon: 'hdd' },
  { id: 'about', label: 'About This Mac', icon: 'about' },
];

@Component({
  selector: 'mw-app-settings',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  readonly windowId = input<string>('');

  readonly settings = inject(SettingsService);
  private readonly wm = inject(WindowManagerService);
  private readonly storage = inject(StorageService);
  private readonly dialog = inject(DialogService);

  readonly sections = SECTIONS;
  readonly active = signal<SettingsSection>('appearance');
  readonly wallpapers = WALLPAPERS;
  readonly accentOptions = this.settings.accentOptions();
  readonly storageEstimate = signal<{ usage: number; quota: number } | null>(null);
  readonly storageSupported = signal(true);

  ngOnInit(): void {
    const win = this.wm.windows().find((w) => w.id === this.windowId());
    const section = win?.data['section'];
    if (typeof section === 'string' && SECTIONS.some((s) => s.id === section)) {
      this.active.set(section as SettingsSection);
    }
    void this.loadStorageEstimate();
  }

  private async loadStorageEstimate(): Promise<void> {
    if (!navigator.storage?.estimate) {
      this.storageSupported.set(false);
      return;
    }
    try {
      const estimate = await navigator.storage.estimate();
      this.storageEstimate.set({ usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 });
    } catch {
      this.storageSupported.set(false);
    }
  }

  select(section: SettingsSection): void {
    this.active.set(section);
  }

  setTheme(theme: ThemeMode): void {
    this.settings.update({ theme });
  }

  setAccent(accent: AccentColor): void {
    this.settings.update({ accent });
  }

  setWallpaper(id: string): void {
    this.settings.update({ wallpaperId: id });
  }

  setWallpaperFit(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'cover' | 'contain' | 'fill' | 'center';
    this.settings.update({ wallpaperFit: value });
  }

  setDockSize(event: Event): void {
    this.settings.update({ dockSize: Number((event.target as HTMLInputElement).value) });
  }

  toggleDockAutoHide(): void {
    this.settings.update({ dockAutoHide: !this.settings.settings().dockAutoHide });
  }

  toggleDockMagnification(): void {
    this.settings.update({ dockMagnification: !this.settings.settings().dockMagnification });
  }

  toggleShowDate(): void {
    this.settings.update({ showDateInMenuBar: !this.settings.settings().showDateInMenuBar });
  }

  toggle24h(): void {
    this.settings.update({ use24HourClock: !this.settings.settings().use24HourClock });
  }

  toggleSound(): void {
    this.settings.update({ soundEnabled: !this.settings.settings().soundEnabled });
  }

  setVolume(event: Event): void {
    this.settings.update({ volume: Number((event.target as HTMLInputElement).value) });
  }

  toggleReduceMotion(): void {
    this.settings.update({ reduceMotion: !this.settings.settings().reduceMotion });
  }

  setUserName(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.settings.update({ userName: value || 'Guest User' });
  }

  togglePassword(): void {
    const enabled = !this.settings.settings().passwordEnabled;
    this.settings.update({ passwordEnabled: enabled, passwordHash: enabled ? this.settings.settings().passwordHash : null });
  }

  async setDemoPassword(value: string): Promise<void> {
    if (!value) return;
    const hash = await this.hash(value);
    this.settings.update({ passwordEnabled: true, passwordHash: hash });
    await this.dialog.alert({ title: 'رمز عبور نمایشی', message: 'رمز عبور نمایشی با موفقیت تنظیم شد.' });
  }

  private async hash(value: string): Promise<string> {
    try {
      const data = new TextEncoder().encode(value);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      return value;
    }
  }

  async resetDefaults(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'بازگرداندن تنظیمات پیش‌فرض',
      message: 'همه تنظیمات ظاهری و سیستمی به حالت اولیه بازمی‌گردند. فایل‌ها و یادداشت‌ها حذف نمی‌شوند.',
      confirmLabel: 'بازگردانی',
      danger: true,
    });
    if (confirmed) this.settings.resetToDefaults();
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 بایت';
    const units = ['بایت', 'KB', 'MB', 'GB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  get storageDegraded() {
    return this.storage.storageDegraded;
  }
}
