import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ClockService } from '../../core/services/clock.service';
import { SettingsService } from '../../core/services/settings.service';
import { SystemStateService } from '../../core/services/system-state.service';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { ApplicationRegistryService } from '../../core/services/application-registry.service';
import { ContextMenuService, ContextMenuItem } from '../../core/services/context-menu.service';
import { DialogService } from '../../core/services/dialog.service';
import { StorageService } from '../../core/services/storage.service';
import { FileSystemService } from '../../core/services/file-system.service';
import { NotificationService } from '../../core/services/notification.service';
import { SoundService } from '../../core/services/sound.service';
import { PanelService } from '../../core/services/panel.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { formatShortDate, formatTime } from '../../shared/utils/date.util';

@Component({
  selector: 'mw-menu-bar',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './menu-bar.component.html',
  styleUrl: './menu-bar.component.scss',
})
export class MenuBarComponent implements OnInit, OnDestroy {
  private readonly clock = inject(ClockService);
  readonly settings = inject(SettingsService);
  private readonly system = inject(SystemStateService);
  private readonly wm = inject(WindowManagerService);
  private readonly registry = inject(ApplicationRegistryService);
  private readonly contextMenu = inject(ContextMenuService);
  private readonly dialog = inject(DialogService);
  private readonly storage = inject(StorageService);
  private readonly fs = inject(FileSystemService);
  private readonly notifications = inject(NotificationService);
  private readonly sound = inject(SoundService);
  readonly panels = inject(PanelService);

  readonly time = computed(() => formatTime(this.clock.now(), this.settings.settings().use24HourClock));
  readonly date = computed(() => formatShortDate(this.clock.now()));
  readonly unreadCount = this.notifications.unreadCount;
  readonly batteryLevel = signal(87);

  readonly activeApp = computed(() => {
    const win = this.wm.activeWindow();
    if (!win) return 'Finder';
    return this.registry.get(win.appId)?.name ?? 'Finder';
  });

  private batteryTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.batteryTimer = setInterval(() => {
      this.batteryLevel.update((v) => (v <= 20 ? 100 : v - 1));
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.batteryTimer) clearInterval(this.batteryTimer);
  }

  openAppleMenu(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const items: ContextMenuItem[] = [
      {
        id: 'about',
        label: 'درباره MacWeb OS',
        icon: 'about',
        action: () => this.wm.open('about'),
      },
      { id: 'sep1', separator: true },
      { id: 'settings', label: 'تنظیمات سیستم…', icon: 'settings', action: () => this.wm.open('settings') },
      { id: 'appstore', label: 'App Store…', icon: 'app-store', action: () => this.wm.open('app-store') },
      { id: 'sep2', separator: true },
      { id: 'sleep', label: 'خواب', icon: 'moon', action: () => this.system.sleep() },
      { id: 'lock', label: 'قفل صفحه', icon: 'lock', action: () => this.lockScreen() },
      {
        id: 'logout',
        label: 'خروج از حساب',
        icon: 'power',
        action: () => this.lockScreen(),
      },
      { id: 'sep3', separator: true },
      {
        id: 'reset',
        label: 'بازنشانی محیط…',
        icon: 'refresh',
        danger: true,
        action: () => this.resetEnvironment(),
      },
    ];
    this.contextMenu.open(rect.left, rect.bottom + 4, items);
  }

  openFileMenu(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const active = this.wm.activeWindow();
    const appDef = active ? this.registry.get(active.appId) : undefined;
    const canNewWindow = !!appDef && !appDef.singleInstance;
    const items: ContextMenuItem[] = [
      {
        id: 'new-window',
        label: 'پنجره جدید',
        icon: 'plus',
        disabled: !canNewWindow,
        action: () => active && this.wm.open(active.appId, { forceNew: true }),
      },
      {
        id: 'close-window',
        label: 'بستن پنجره',
        icon: 'close',
        disabled: !active,
        action: () => active && this.wm.close(active.id),
      },
    ];
    this.contextMenu.open(rect.left, rect.bottom + 4, items);
  }

  openEditMenu(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const items: ContextMenuItem[] = [
      { id: 'cut', label: 'برش', icon: 'close', action: () => this.execEdit('cut') },
      { id: 'copy', label: 'کپی', icon: 'check', action: () => this.execEdit('copy') },
      { id: 'paste', label: 'چسباندن', icon: 'download', action: () => this.execEdit('paste') },
    ];
    this.contextMenu.open(rect.left, rect.bottom + 4, items);
  }

  private execEdit(command: 'cut' | 'copy' | 'paste'): void {
    try {
      document.execCommand(command);
    } catch {
      /* Clipboard access may be blocked by browser permissions; silently ignore. */
    }
  }

  openViewMenu(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const isDark = this.settings.theme() === 'dark';
    const isFullscreen = !!document.fullscreenElement;
    const items: ContextMenuItem[] = [
      {
        id: 'theme',
        label: isDark ? 'حالت روشن' : 'حالت تاریک',
        icon: isDark ? 'sun' : 'moon',
        action: () => this.settings.toggleTheme(),
      },
      {
        id: 'fullscreen',
        label: isFullscreen ? 'خروج از تمام‌صفحه' : 'ورود به حالت تمام‌صفحه',
        icon: 'grid',
        action: () => this.toggleFullscreen(),
      },
    ];
    this.contextMenu.open(rect.left, rect.bottom + 4, items);
  }

  private toggleFullscreen(): void {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen().catch(() => {
        /* Fullscreen might be denied by the embedding context; no-op. */
      });
    }
  }

  openWindowMenu(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const active = this.wm.activeWindow();
    const items: ContextMenuItem[] = [
      {
        id: 'minimize',
        label: 'کوچک‌کردن',
        icon: 'minus',
        disabled: !active,
        action: () => active && this.wm.minimize(active.id),
      },
      {
        id: 'zoom',
        label: 'بزرگ‌نمایی',
        icon: 'plus',
        disabled: !active,
        action: () => active && this.wm.toggleMaximize(active.id),
      },
      { id: 'sep', separator: true },
      ...this.wm.windows().map((w) => ({
        id: w.id,
        label: w.title,
        icon: w.icon,
        action: () => (w.minimized ? this.wm.restore(w.id) : this.wm.focus(w.id)),
      })),
    ];
    this.contextMenu.open(rect.left, rect.bottom + 4, items.length ? items : [{ id: 'none', label: 'بدون پنجره باز' }]);
  }

  openHelpMenu(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.contextMenu.open(rect.left, rect.bottom + 4, [
      {
        id: 'help',
        label: 'راهنمای MacWeb OS',
        icon: 'info',
        action: () => this.wm.open('safari', { data: { url: 'macweb://help' } }),
      },
    ]);
  }

  openWifiMenu(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.contextMenu.open(rect.right - 200, rect.bottom + 4, [
      {
        id: 'toggle',
        label: this.settings.settings().wifiEnabled ? 'خاموش‌کردن Wi-Fi' : 'روشن‌کردن Wi-Fi',
        icon: 'wifi',
        action: () => this.settings.update({ wifiEnabled: !this.settings.settings().wifiEnabled }),
      },
      {
        id: 'network',
        label: this.settings.settings().wifiEnabled ? 'متصل به: MacWeb-Network' : 'Wi-Fi خاموش است',
        disabled: true,
      },
    ]);
  }

  openSpotlight(): void {
    this.panels.toggle('spotlight');
  }

  openControlCenter(): void {
    this.panels.toggle('control-center');
  }

  openNotifications(): void {
    this.panels.toggle('notifications');
  }

  private lockScreen(): void {
    this.sound.lock();
    this.system.lock();
  }

  private async resetEnvironment(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'بازنشانی محیط',
      message: 'همه تنظیمات، فایل‌ها، یادداشت‌ها و رویدادهای ذخیره‌شده حذف خواهند شد. این عملیات برگشت‌ناپذیر است.',
      confirmLabel: 'بازنشانی',
      danger: true,
    });
    if (!confirmed) return;

    this.storage.clearAll();
    await this.fs.deletePermanently('root').catch(() => undefined);
    indexedDB.deleteDatabase('macweb-os-fs');
    window.location.reload();
  }
}
