import {
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  Type,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { WindowState } from '../../../core/models/window.model';
import { WindowManagerService } from '../../../core/services/window-manager.service';
import { ApplicationRegistryService } from '../../../core/services/application-registry.service';
import { IconComponent } from '../icon/icon.component';

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/**
 * Generic window chrome shared by every application. Apps never implement
 * their own drag/resize/minimize/maximize logic – they are simple content
 * components rendered inside this frame via `NgComponentOutlet`.
 */
@Component({
  selector: 'mw-window-frame',
  standalone: true,
  imports: [NgComponentOutlet, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './window-frame.component.html',
  styleUrl: './window-frame.component.scss',
  host: {
    '[style.left.px]': 'win().rect.x',
    '[style.top.px]': 'win().rect.y',
    '[style.width.px]': 'win().rect.width',
    '[style.height.px]': 'win().rect.height',
    '[style.zIndex]': 'win().zIndex',
    '[class.active]': 'win().active',
    '[class.maximized]': 'win().maximized',
    '[attr.aria-hidden]': 'win().minimized',
    '[style.display]': "win().minimized ? 'none' : 'flex'",
    class: 'mw-window',
    '(pointerdown)': 'onFocus()',
  },
})
export class WindowFrameComponent implements OnInit, OnDestroy {
  readonly win = input.required<WindowState>();

  private readonly wm = inject(WindowManagerService);
  private readonly registry = inject(ApplicationRegistryService);
  private readonly zone = inject(NgZone);

  readonly component = signal<Type<unknown> | null>(null);
  readonly loadError = signal(false);

  private dragging = false;
  private dragStartPointer = { x: 0, y: 0 };
  private dragStartRect = { x: 0, y: 0 };
  private resizeDir: ResizeDirection | null = null;
  private resizeStartPointer = { x: 0, y: 0 };
  private resizeStartRect = { x: 0, y: 0, width: 0, height: 0 };

  private readonly onPointerMove = (e: PointerEvent) => this.handlePointerMove(e);
  private readonly onPointerUp = () => this.handlePointerUp();

  ngOnInit(): void {
    const def = this.registry.get(this.win().appId);
    if (!def) {
      this.loadError.set(true);
      return;
    }
    def
      .loadComponent()
      .then((cmp) => this.component.set(cmp))
      .catch(() => this.loadError.set(true));
  }

  ngOnDestroy(): void {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  onFocus(): void {
    if (!this.win().active) this.wm.focus(this.win().id);
  }

  close(event: Event): void {
    event.stopPropagation();
    this.wm.close(this.win().id);
  }

  minimize(event: Event): void {
    event.stopPropagation();
    this.wm.minimize(this.win().id);
  }

  toggleMaximize(event?: Event): void {
    event?.stopPropagation();
    this.wm.toggleMaximize(this.win().id);
  }

  startDrag(event: PointerEvent): void {
    if (event.button !== 0 || this.win().maximized) return;
    event.preventDefault();
    this.wm.focus(this.win().id);
    this.dragging = true;
    this.dragStartPointer = { x: event.clientX, y: event.clientY };
    this.dragStartRect = { x: this.win().rect.x, y: this.win().rect.y };
    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
    });
  }

  startResize(event: PointerEvent, dir: ResizeDirection): void {
    if (event.button !== 0 || this.win().maximized || !this.win().resizable) return;
    event.preventDefault();
    event.stopPropagation();
    this.wm.focus(this.win().id);
    this.resizeDir = dir;
    this.resizeStartPointer = { x: event.clientX, y: event.clientY };
    this.resizeStartRect = { ...this.win().rect };
    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
    });
  }

  private handlePointerMove(event: PointerEvent): void {
    if (this.dragging) {
      const dx = event.clientX - this.dragStartPointer.x;
      const dy = event.clientY - this.dragStartPointer.y;
      this.zone.run(() => {
        this.wm.move(this.win().id, this.dragStartRect.x + dx, this.dragStartRect.y + dy);
      });
      return;
    }
    if (this.resizeDir) {
      const dx = event.clientX - this.resizeStartPointer.x;
      const dy = event.clientY - this.resizeStartPointer.y;
      const start = this.resizeStartRect;
      let { x, y, width, height } = start;

      if (this.resizeDir.includes('e')) width = start.width + dx;
      if (this.resizeDir.includes('s')) height = start.height + dy;
      if (this.resizeDir.includes('w')) {
        width = start.width - dx;
        x = start.x + dx;
      }
      if (this.resizeDir.includes('n')) {
        height = start.height - dy;
        y = start.y + dy;
      }

      this.zone.run(() => {
        const win = this.win();
        if (width < win.minSize.width) {
          if (this.resizeDir!.includes('w')) x = start.x + start.width - win.minSize.width;
          width = win.minSize.width;
        }
        if (height < win.minSize.height) {
          if (this.resizeDir!.includes('n')) y = start.y + start.height - win.minSize.height;
          height = win.minSize.height;
        }
        this.wm.resize(this.win().id, width, height, x, y);
      });
    }
  }

  private handlePointerUp(): void {
    this.dragging = false;
    this.resizeDir = null;
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }
}
