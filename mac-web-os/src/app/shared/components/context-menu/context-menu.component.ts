import { ChangeDetectionStrategy, Component, HostListener, computed, inject } from '@angular/core';
import { ContextMenuService } from '../../../core/services/context-menu.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'mw-context-menu',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (menu().request; as req) {
      <div
        class="mw-context-menu"
        role="menu"
        [style.left.px]="x()"
        [style.top.px]="y()"
        (click)="$event.stopPropagation()"
      >
        @for (item of req.items; track item.id) {
          @if (item.separator) {
            <div class="mw-context-menu__separator"></div>
          } @else {
            <button
              type="button"
              role="menuitem"
              class="mw-context-menu__item"
              [class.danger]="item.danger"
              [disabled]="item.disabled"
              (click)="run(item)"
            >
              @if (item.icon) {
                <mw-icon [name]="item.icon" [size]="15" />
              }
              <span>{{ item.label }}</span>
            </button>
          }
        }
      </div>
    }
  `,
  styleUrl: './context-menu.component.scss',
})
export class ContextMenuComponent {
  private readonly menuService = inject(ContextMenuService);
  readonly menu = computed(() => ({ request: this.menuService.request() }));

  x = computed(() => {
    const req = this.menuService.request();
    if (!req) return 0;
    const maxX = window.innerWidth - 220;
    return Math.min(req.x, Math.max(8, maxX));
  });

  y = computed(() => {
    const req = this.menuService.request();
    if (!req) return 0;
    const maxY = window.innerHeight - 40;
    return Math.min(req.y, Math.max(8, maxY));
  });

  @HostListener('document:click')
  onDocumentClick(): void {
    this.menuService.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuService.close();
  }

  run(item: { disabled?: boolean; action?: () => void }): void {
    if (item.disabled) return;
    item.action?.();
    this.menuService.close();
  }
}
