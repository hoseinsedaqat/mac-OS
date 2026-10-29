import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { WallpaperComponent } from '../../shared/components/wallpaper/wallpaper.component';
import { MenuBarComponent } from '../menu-bar/menu-bar.component';
import { DockComponent } from '../dock/dock.component';
import { SpotlightComponent } from '../spotlight/spotlight.component';
import { ControlCenterComponent } from '../control-center/control-center.component';
import { NotificationCenterComponent } from '../notifications/notification-center.component';
import { ToastStackComponent } from '../notifications/toast-stack.component';
import { LaunchpadComponent } from '../launchpad/launchpad.component';
import { DesktopIconComponent } from './desktop-icon.component';
import { WindowFrameComponent } from '../../shared/components/window-frame/window-frame.component';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { DesktopService } from '../../core/services/desktop.service';
import { SettingsService } from '../../core/services/settings.service';
import { PanelService } from '../../core/services/panel.service';
import { KeyboardShortcutService } from '../../core/services/keyboard-shortcut.service';
import { ContextMenuService, ContextMenuItem } from '../../core/services/context-menu.service';
import { FileSystemService } from '../../core/services/file-system.service';
import { NotificationService } from '../../core/services/notification.service';
import { I18nService } from '../../core/services/i18n.service';
import { DOCUMENTS_ID } from '../../core/models/file-system.model';

@Component({
  selector: 'mw-desktop',
  standalone: true,
  imports: [
    WallpaperComponent,
    MenuBarComponent,
    DockComponent,
    SpotlightComponent,
    ControlCenterComponent,
    NotificationCenterComponent,
    ToastStackComponent,
    LaunchpadComponent,
    DesktopIconComponent,
    WindowFrameComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './desktop.component.html',
  styleUrl: './desktop.component.scss',
})
export class DesktopComponent implements OnInit, OnDestroy {
  readonly wm = inject(WindowManagerService);
  readonly desktop = inject(DesktopService);
  readonly settings = inject(SettingsService);
  private readonly panels = inject(PanelService);
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly contextMenu = inject(ContextMenuService);
  private readonly fs = inject(FileSystemService);
  private readonly notifications = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  readonly brightnessFilter = computed(() => `brightness(${this.settings.settings().brightness}%)`);

  private unregisterFns: Array<() => void> = [];
  private welcomed = false;

  ngOnInit(): void {
    this.shortcuts.attach();
    this.unregisterFns.push(
      this.shortcuts.register('mod+space', () => this.panels.toggle('spotlight')),
      this.shortcuts.register('escape', () => this.panels.close()),
      this.shortcuts.register('mod+w', () => {
        const active = this.wm.activeWindow();
        if (active) this.wm.close(active.id);
      }),
      this.shortcuts.register('mod+m', () => {
        const active = this.wm.activeWindow();
        if (active) this.wm.minimize(active.id);
      }),
      this.shortcuts.register('mod+q', () => {
        const active = this.wm.activeWindow();
        if (active) this.wm.closeAppWindows(active.appId);
      }),
      this.shortcuts.register('alt+tab', () => this.cycleWindows()),
    );

    if (!this.welcomed) {
      this.welcomed = true;
      setTimeout(() => {
        this.notifications.push({
          appId: 'about',
          appName: 'MacWeb OS',
          icon: 'about',
          title: this.i18n.t('shell.notifications.welcomeTitle'),
          body: this.i18n.t('shell.notifications.welcomeBody'),
        });
      }, 1200);
    }
  }

  ngOnDestroy(): void {
    this.unregisterFns.forEach((fn) => fn());
    this.shortcuts.detach();
  }

  private cycleWindows(): void {
    const windows = this.wm.windows();
    if (windows.length < 2) return;
    const sorted = [...windows].sort((a, b) => b.zIndex - a.zIndex);
    const next = sorted[1] ?? sorted[0];
    if (next.minimized) this.wm.restore(next.id);
    else this.wm.focus(next.id);
  }

  onDesktopClick(): void {
    this.desktop.select(null);
    this.panels.close();
  }

  onDesktopContextMenu(event: MouseEvent): void {
    event.preventDefault();
    const items: ContextMenuItem[] = [
      {
        id: 'new-folder',
        label: this.i18n.t('shell.desktop.contextMenu.newFolder'),
        icon: 'folder',
        action: () => {
          void this.fs.createFolder(DOCUMENTS_ID, this.i18n.t('common.untitled')).then(() => {
            this.wm.open('finder', { data: { folderId: DOCUMENTS_ID } });
          });
        },
      },
      {
        id: 'clean-up',
        label: this.i18n.t('shell.desktop.contextMenu.resetIconPositions'),
        icon: 'grid',
        action: () => this.desktop.resetPositions(),
      },
      { id: 'sep', separator: true },
      {
        id: 'change-wallpaper',
        label: this.i18n.t('shell.desktop.contextMenu.changeWallpaper'),
        icon: 'photos',
        action: () => this.wm.open('settings', { data: { section: 'wallpaper' } }),
      },
      {
        id: 'settings',
        label: this.i18n.t('shell.desktop.contextMenu.settings'),
        icon: 'settings',
        action: () => this.wm.open('settings'),
      },
    ];
    this.contextMenu.open(event.clientX, event.clientY, items);
  }
}
