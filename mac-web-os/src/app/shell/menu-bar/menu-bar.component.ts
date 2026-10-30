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
import { I18nService } from '../../core/services/i18n.service';
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
  readonly i18n = inject(I18nService);

  private readonly locale = 'en-US';
  readonly time = computed(() =>
    formatTime(this.clock.now(), this.settings.settings().use24HourClock, this.locale),
  );
  readonly date = computed(() => formatShortDate(this.clock.now(), this.locale));
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
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const t = (key: string) => this.i18n.t(key);
    const items: ContextMenuItem[] = [
      {
        id: 'about',
        label: t('shell.menuBar.about'),
        icon: 'about',
        action: () => this.wm.open('about'),
      },
      { id: 'sep1', separator: true },
      { id: 'settings', label: t('shell.menuBar.systemSettings'), icon: 'settings', action: () => this.wm.open('settings') },
      { id: 'appstore', label: 'App Store…', icon: 'app-store', action: () => this.wm.open('app-store') },
      { id: 'sep2', separator: true },
      { id: 'sleep', label: t('shell.menuBar.sleep'), icon: 'moon', action: () => this.system.sleep() },
      {
        id: 'restart',
        label: t('shell.menuBar.restart'),
        icon: 'refresh',
        action: () => void this.confirmRestart(),
      },
      {
        id: 'shutdown',
        label: t('shell.menuBar.shutDown'),
        icon: 'power',
        action: () => void this.confirmShutDown(),
      },
      { id: 'sep2b', separator: true },
      { id: 'lock', label: t('shell.menuBar.lockScreen'), icon: 'lock', action: () => this.lockScreen() },
      { id: 'sep3', separator: true },
      {
        id: 'reset',
        label: t('apps.settings.resetEnvironment'),
        icon: 'refresh',
        danger: true,
        action: () => this.resetEnvironment(),
      },
    ];
    this.contextMenu.open(rect.left, rect.bottom + 4, items);
  }

  openFileMenu(event: MouseEvent): void {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const active = this.wm.activeWindow();
    const appDef = active ? this.registry.get(active.appId) : undefined;
    const canNewWindow = !!appDef && !appDef.singleInstance;
    const items: ContextMenuItem[] = [
      {
        id: 'new-window',
        label: 'New Window',
        icon: 'plus',
        disabled: !canNewWindow,
        action: () => active && this.wm.open(active.appId, { forceNew: true }),
      },
      {
        id: 'close-window',
        label: 'Close Window',
        icon: 'close',
        disabled: !active,
        action: () => active && this.wm.close(active.id),
      },
    ];
    this.contextMenu.open(rect.left, rect.bottom + 4, items);
  }

  openEditMenu(event: MouseEvent): void {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const items: ContextMenuItem[] = [
      { id: 'cut', label: 'Cut', icon: 'close', action: () => this.execEdit('cut') },
      { id: 'copy', label: 'Copy', icon: 'check', action: () => this.execEdit('copy') },
      { id: 'paste', label: 'Paste', icon: 'download', action: () => this.execEdit('paste') },
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
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const isDark = this.settings.theme() === 'dark';
    const isFullscreen = !!document.fullscreenElement;
    const items: ContextMenuItem[] = [
      {
        id: 'theme',
        label: isDark ? 'Light Mode' : 'Dark Mode',
        icon: isDark ? 'sun' : 'moon',
        action: () => this.settings.toggleTheme(),
      },
      {
        id: 'fullscreen',
        label: isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen',
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
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const active = this.wm.activeWindow();
    const items: ContextMenuItem[] = [
      {
        id: 'minimize',
        label: 'Minimize',
        icon: 'minus',
        disabled: !active,
        action: () => active && this.wm.minimize(active.id),
      },
      {
        id: 'zoom',
        label: 'Zoom',
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
    this.contextMenu.open(
      rect.left,
      rect.bottom + 4,
      items.length ? items : [{ id: 'none', label: 'No Open Windows' }],
    );
  }

  openHelpMenu(event: MouseEvent): void {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.contextMenu.open(rect.left, rect.bottom + 4, [
      {
        id: 'help',
        label: 'MacWeb OS Help',
        icon: 'info',
        action: () => this.wm.open('safari', { data: { url: 'macweb://help' } }),
      },
    ]);
  }

  openWifiMenu(event: MouseEvent): void {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const wifiOn = this.settings.settings().wifiEnabled;
    this.contextMenu.open(rect.right - 200, rect.bottom + 4, [
      {
        id: 'toggle',
        label: wifiOn ? 'Turn Wi-Fi Off' : 'Turn Wi-Fi On',
        icon: 'wifi',
        action: () => this.settings.update({ wifiEnabled: !wifiOn }),
      },
      {
        id: 'network',
        label: wifiOn ? 'MacWeb-Network' : 'Wi-Fi is Off',
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

  private async confirmRestart(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: this.i18n.t('shell.restart.confirmTitle'),
      message: this.i18n.t('shell.restart.confirmMessage'),
      confirmLabel: this.i18n.t('shell.menuBar.restart'),
    });
    if (!confirmed) return;
    this.sound.shutdown();
    this.wm.closeAll();
    this.system.restart();
  }

  private async confirmShutDown(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: this.i18n.t('shell.shutdown.confirmTitle'),
      message: this.i18n.t('shell.shutdown.confirmMessage'),
      confirmLabel: this.i18n.t('shell.menuBar.shutDown'),
      danger: true,
    });
    if (!confirmed) return;
    this.sound.shutdown();
    this.wm.closeAll();
    this.system.powerOff();
  }

  private async resetEnvironment(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: this.i18n.t('apps.settings.resetEnvironmentConfirmTitle'),
      message: this.i18n.t('apps.settings.resetEnvironmentConfirmMessage'),
      confirmLabel: 'Reset',
      danger: true,
    });
    if (!confirmed) return;

    this.storage.clearAll();
    await this.fs.deletePermanently('root').catch(() => undefined);
    indexedDB.deleteDatabase('macweb-os-fs');
    window.location.reload();
  }
}
