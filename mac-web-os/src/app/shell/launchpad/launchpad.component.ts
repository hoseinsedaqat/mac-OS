import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PanelService } from '../../core/services/panel.service';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { ApplicationRegistryService } from '../../core/services/application-registry.service';
import { DialogService } from '../../core/services/dialog.service';
import { ContextMenuService } from '../../core/services/context-menu.service';
import { I18nService } from '../../core/services/i18n.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { LAUNCHPAD_CATEGORIES, LAUNCHPAD_TILES, LaunchpadCategory, LaunchpadTile } from './launchpad-apps.data';

interface ResolvedTile {
  tile: LaunchpadTile;
  name: string;
  icon: string;
  background: string;
  glyphColor: string;
  text: string | null;
}

/**
 * The "Applications" Launchpad: a full-screen overlay with category pills
 * and a grid of colourful app tiles, styled after macOS Launchpad. Real
 * apps open for real; apps that only exist in the reference screenshot and
 * have no implementation in this project show a clearly-labelled dialog
 * instead of silently doing nothing.
 */
@Component({
  selector: 'mw-launchpad',
  standalone: true,
  imports: [IconComponent, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './launchpad.component.html',
  styleUrl: './launchpad.component.scss',
})
export class LaunchpadComponent {
  private readonly panels = inject(PanelService);
  private readonly wm = inject(WindowManagerService);
  private readonly registry = inject(ApplicationRegistryService);
  private readonly dialog = inject(DialogService);
  private readonly contextMenu = inject(ContextMenuService);
  readonly i18n = inject(I18nService);

  readonly isOpen = computed(() => this.panels.active() === 'launchpad');
  readonly categories = LAUNCHPAD_CATEGORIES;
  readonly activeCategory = signal<'all' | LaunchpadCategory>('all');
  readonly viewMode = signal<'grid' | 'compact'>('grid');
  readonly sortAlpha = signal(false);

  private readonly todayNumber = String(new Date().getDate());

  readonly tiles = computed<ResolvedTile[]>(() => {
    const category = this.activeCategory();
    let list = LAUNCHPAD_TILES.filter((t) => category === 'all' || t.category === category);
    const resolved = list.map((tile) => this.resolve(tile));
    if (this.sortAlpha()) {
      return [...resolved].sort((a, b) => a.name.localeCompare(b.name));
    }
    return resolved;
  });

  private resolve(tile: LaunchpadTile): ResolvedTile {
    if (tile.kind === 'real') {
      const app = this.registry.get(tile.appId);
      const isCalendar = tile.appId === 'calendar';
      return {
        tile,
        name: tile.nameOverride ?? app?.name ?? tile.appId,
        icon: app?.icon ?? 'apps',
        background: tile.background,
        glyphColor: tile.glyphColor ?? '#fff',
        text: isCalendar ? this.todayNumber : null,
      };
    }
    return {
      tile,
      name: this.i18n.t(tile.nameKey),
      icon: tile.glyph ?? 'apps',
      background: tile.background,
      glyphColor: tile.glyphColor ?? '#fff',
      text: tile.text ?? null,
    };
  }

  close(): void {
    this.panels.close();
  }

  selectCategory(id: 'all' | LaunchpadCategory): void {
    this.activeCategory.set(id);
  }

  toggleViewMode(): void {
    this.viewMode.update((v) => (v === 'grid' ? 'compact' : 'grid'));
  }

  openMoreMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.contextMenu.open(event.clientX, event.clientY, [
      {
        id: 'sort',
        label: this.sortAlpha()
          ? this.i18n.t('shell.launchpad.menu.sortByCategory')
          : this.i18n.t('shell.launchpad.menu.sortByName'),
        icon: 'list',
        action: () => this.sortAlpha.update((v) => !v),
      },
      {
        id: 'reset',
        label: this.i18n.t('shell.launchpad.menu.resetFilters'),
        icon: 'refresh',
        action: () => this.activeCategory.set('all'),
      },
    ]);
  }

  async activate(resolved: ResolvedTile): Promise<void> {
    const tile = resolved.tile;
    if (tile.kind === 'real') {
      this.wm.open(tile.appId);
      this.close();
      return;
    }

    if (tile.suggestAppId) {
      const confirmed = await this.dialog.confirm({
        title: resolved.name,
        message: this.i18n.t('shell.launchpad.notImplementedSuggest', resolved.name),
        confirmLabel: this.i18n.t('shell.launchpad.menu.openSuggestion'),
      });
      if (confirmed) {
        this.wm.open(tile.suggestAppId);
        this.close();
      }
      return;
    }

    await this.dialog.alert({
      title: resolved.name,
      message: this.i18n.t('shell.launchpad.notImplemented', resolved.name),
    });
  }
}
