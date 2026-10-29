import { ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { ApplicationRegistryService } from '../../core/services/application-registry.service';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { SettingsService } from '../../core/services/settings.service';
import { ContextMenuService, ContextMenuItem } from '../../core/services/context-menu.service';
import { SoundService } from '../../core/services/sound.service';
import { PanelService } from '../../core/services/panel.service';
import { I18nService } from '../../core/services/i18n.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { getIconTheme } from '../../shared/utils/icon-theme.data';
import { AppDefinition } from '../../core/models/app.model';

@Component({
  selector: 'mw-dock',
  standalone: true,
  imports: [AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dock.component.html',
  styleUrl: './dock.component.scss',
})
export class DockComponent implements OnDestroy {
  private readonly registry = inject(ApplicationRegistryService);
  readonly wm = inject(WindowManagerService);
  readonly settings = inject(SettingsService);
  private readonly contextMenu = inject(ContextMenuService);
  private readonly sound = inject(SoundService);
  private readonly panels = inject(PanelService);
  readonly i18n = inject(I18nService);

  readonly dockEl = viewChild<ElementRef<HTMLElement>>('dockEl');
  readonly apps = computed(() => this.registry.dockApps().filter((a) => a.id !== 'trash'));
  readonly trashApp = computed(() => this.registry.get('trash') as AppDefinition);
  readonly iconSize = computed(() => Math.max(28, this.settings.settings().dockSize - 12));

  readonly hovering = signal(false);
  readonly scales = signal<Record<string, number>>({});
  readonly bouncing = signal<string | null>(null);

  private readonly todayNumber = String(new Date().getDate());

  themeFor(id: string) {
    return getIconTheme(id);
  }

  glyphTextFor(id: string): string | null {
    return id === 'calendar' ? this.todayNumber : null;
  }

  isRunning(appId: string): boolean {
    return this.wm.isOpen(appId);
  }

  hasMinimized(appId: string): boolean {
    return this.wm.windowsForApp(appId).some((w) => w.minimized);
  }

  scaleFor(appId: string): number {
    return this.scales()[appId] ?? 1;
  }

  onDockPointerMove(event: PointerEvent): void {
    if (!this.settings.settings().dockMagnification) return;
    const el = this.dockEl()?.nativeElement;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-dock-item]'));
    const next: Record<string, number> = {};
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(event.clientX - center);
      const influence = Math.max(0, 1 - distance / 140);
      const scale = 1 + influence * 0.45;
      const id = item.dataset['dockItem'];
      if (id) next[id] = Math.round(scale * 100) / 100;
    }
    this.scales.set(next);
  }

  onDockPointerLeave(): void {
    this.hovering.set(false);
    this.scales.set({});
  }

  onDockPointerEnter(): void {
    this.hovering.set(true);
  }

  activate(app: AppDefinition): void {
    const windows = this.wm.windowsForApp(app.id);
    if (windows.length === 0) {
      this.wm.open(app.id);
      this.triggerBounce(app.id);
      return;
    }
    const active = windows.find((w) => w.active && !w.minimized);
    if (active) {
      // App already focused: clicking again minimizes it, matching native dock behaviour.
      this.wm.minimize(active.id);
      return;
    }
    const minimized = windows.find((w) => w.minimized);
    if (minimized) {
      this.wm.restore(minimized.id);
      return;
    }
    this.wm.focus(windows[0].id);
  }

  private triggerBounce(appId: string): void {
    this.bouncing.set(appId);
    setTimeout(() => this.bouncing.set(null), 600);
  }

  onContextMenu(event: MouseEvent, app: AppDefinition): void {
    event.preventDefault();
    const running = this.isRunning(app.id);
    const items: ContextMenuItem[] = [
      { id: 'open', label: 'Open', icon: 'chevronRight', action: () => this.activate(app) },
      ...(running
        ? [
            {
              id: 'quit',
              label: 'Quit App',
              icon: 'close',
              danger: true,
              action: () => this.wm.closeAppWindows(app.id),
            },
          ]
        : []),
    ];
    this.contextMenu.open(event.clientX, event.clientY, items);
  }

  openTrash(): void {
    this.activate(this.trashApp());
  }

  openLaunchpad(): void {
    this.panels.toggle('launchpad');
  }

  ngOnDestroy(): void {
    this.scales.set({});
  }
}
