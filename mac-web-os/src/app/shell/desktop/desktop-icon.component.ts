import { ChangeDetectionStrategy, Component, NgZone, computed, inject, input } from '@angular/core';
import { DesktopIconDef, DesktopService } from '../../core/services/desktop.service';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { ContextMenuService } from '../../core/services/context-menu.service';
import { DialogService } from '../../core/services/dialog.service';
import { I18nService } from '../../core/services/i18n.service';
import { PanelService } from '../../core/services/panel.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { getIconTheme } from '../../shared/utils/icon-theme.data';

@Component({
  selector: 'mw-desktop-icon',
  standalone: true,
  imports: [AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="mw-desktop-icon"
      [class.selected]="desktop.selectedId() === def().id"
      [style.left.px]="position().x"
      [style.top.px]="position().y"
      (pointerdown)="startDrag($event)"
      (click)="select($event)"
      (dblclick)="open()"
      (contextmenu)="onContextMenu($event)"
    >
      <span class="mw-desktop-icon__glyph">
        <mw-app-icon
          [background]="theme().background"
          [glyph]="def().icon"
          [glyphColor]="theme().glyphColor ?? '#fff'"
          [text]="dateText()"
          [size]="52"
        />
      </span>
      <span class="mw-desktop-icon__label">{{ label() }}</span>
    </button>
  `,
  styleUrl: './desktop-icon.component.scss',
})
export class DesktopIconComponent {
  readonly def = input.required<DesktopIconDef>();
  readonly index = input.required<number>();

  readonly desktop = inject(DesktopService);
  private readonly wm = inject(WindowManagerService);
  private readonly contextMenu = inject(ContextMenuService);
  private readonly dialog = inject(DialogService);
  private readonly i18n = inject(I18nService);
  private readonly panels = inject(PanelService);
  private readonly zone = inject(NgZone);

  readonly label = computed(() => this.i18n.t(this.def().labelKey));
  readonly theme = computed(() => getIconTheme(this.def().id));
  readonly dateText = computed(() => (this.theme().dynamicDate ? String(new Date().getDate()) : null));

  private dragging = false;
  private moved = false;
  private startPointer = { x: 0, y: 0 };
  private startPos = { x: 0, y: 0 };
  /** Set from the pointerdown that starts a drag/tap, so a plain `click` can tell touch from mouse/pen. */
  private lastPointerType = 'mouse';

  private readonly onMove = (e: PointerEvent) => this.handleMove(e);
  private readonly onUp = () => this.handleUp();

  position() {
    return this.desktop.positionFor(this.def().id, this.index());
  }

  select(event: Event): void {
    event.stopPropagation();
    if (this.moved) {
      this.moved = false;
      return;
    }
    this.desktop.select(this.def().id);
    // Touch has no real equivalent of a mouse "single click to select, double
    // click to open" — a tap is the only gesture available, so it should
    // behave like tapping an icon on a phone's home screen and open
    // immediately instead of silently just selecting until a second tap
    // happens to land within the double-tap window.
    if (this.lastPointerType === 'touch') this.open();
  }

  open(): void {
    const action = this.def().action;
    if (action.type === 'open-app') {
      this.wm.open(action.appId);
    } else if (action.type === 'open-folder') {
      this.wm.open('finder', { data: { folderId: action.folderId } });
    } else {
      this.panels.open('launchpad');
    }
  }

  startDrag(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.lastPointerType = event.pointerType;
    this.desktop.select(this.def().id);
    this.dragging = true;
    this.moved = false;
    this.startPointer = { x: event.clientX, y: event.clientY };
    this.startPos = this.position();
    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointermove', this.onMove);
      window.addEventListener('pointerup', this.onUp);
    });
  }

  private handleMove(event: PointerEvent): void {
    if (!this.dragging) return;
    const dx = event.clientX - this.startPointer.x;
    const dy = event.clientY - this.startPointer.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this.moved = true;
    const x = Math.max(4, this.startPos.x + dx);
    const y = Math.max(28, this.startPos.y + dy);
    this.zone.run(() => this.desktop.setPosition(this.def().id, x, y));
  }

  private handleUp(): void {
    this.dragging = false;
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
  }

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.desktop.select(this.def().id);
    const isTrash = this.def().id === 'trash';
    this.contextMenu.open(event.clientX, event.clientY, [
      { id: 'open', label: this.i18n.t('common.open'), icon: 'chevronRight', action: () => this.open() },
      { id: 'info', label: this.i18n.t('shell.desktop.getInfo'), icon: 'info', action: () => this.showInfo() },
      ...(isTrash
        ? [
            {
              id: 'empty',
              label: this.i18n.t('shell.desktop.contextMenu.emptyTrash'),
              icon: 'trash2',
              danger: true,
              action: () => this.emptyTrashFromIcon(),
            },
          ]
        : []),
    ]);
  }

  private async emptyTrashFromIcon(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: this.i18n.t('shell.desktop.contextMenu.emptyTrash'),
      message: this.i18n.t('shell.desktop.emptyTrashConfirmMessage'),
      confirmLabel: this.i18n.t('apps.trash.emptyTrash'),
      danger: true,
    });
    if (confirmed) {
      this.wm.open('trash', { data: { emptyRequested: Date.now() } });
    }
  }

  private showInfo(): void {
    this.contextMenu.close();
    void this.dialog.alert({
      title: this.label(),
      message: this.i18n.t('shell.desktop.simulatedItemNotice'),
    });
  }
}
