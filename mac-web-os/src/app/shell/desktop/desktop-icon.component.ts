import { ChangeDetectionStrategy, Component, NgZone, inject, input } from '@angular/core';
import { DesktopIconDef, DesktopService } from '../../core/services/desktop.service';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { ContextMenuService } from '../../core/services/context-menu.service';
import { DialogService } from '../../core/services/dialog.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'mw-desktop-icon',
  standalone: true,
  imports: [IconComponent],
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
        <mw-icon [name]="def().icon" [size]="30" />
      </span>
      <span class="mw-desktop-icon__label">{{ def().label }}</span>
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
  private readonly zone = inject(NgZone);

  private dragging = false;
  private moved = false;
  private startPointer = { x: 0, y: 0 };
  private startPos = { x: 0, y: 0 };

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
  }

  open(): void {
    const action = this.def().action;
    if (action.type === 'open-app') {
      this.wm.open(action.appId);
    } else {
      this.wm.open('finder', { data: { folderId: action.folderId } });
    }
  }

  startDrag(event: PointerEvent): void {
    if (event.button !== 0) return;
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
      { id: 'open', label: 'باز کردن', icon: 'chevronRight', action: () => this.open() },
      { id: 'info', label: 'اطلاعات', icon: 'info', action: () => this.showInfo() },
      ...(isTrash
        ? [
            {
              id: 'empty',
              label: 'خالی‌کردن سطل زباله',
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
      title: 'خالی‌کردن سطل زباله',
      message: 'این عملیات برگشت‌ناپذیر است. آیا مطمئن هستید؟',
      confirmLabel: 'خالی‌کن',
      danger: true,
    });
    if (confirmed) {
      this.wm.open('trash', { data: { emptyRequested: Date.now() } });
    }
  }

  private showInfo(): void {
    this.contextMenu.close();
    void this.dialog.alert({
      title: this.def().label,
      message: 'این یک آیتم شبیه‌سازی‌شده در دسکتاپ MacWeb OS است.',
    });
  }
}
