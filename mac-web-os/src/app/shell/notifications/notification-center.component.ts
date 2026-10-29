import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PanelService } from '../../core/services/panel.service';
import { NotificationService } from '../../core/services/notification.service';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { I18nService } from '../../core/services/i18n.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { relativeFromNow } from '../../shared/utils/date.util';

@Component({
  selector: 'mw-notification-center',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss',
})
export class NotificationCenterComponent {
  private readonly panels = inject(PanelService);
  readonly notifications = inject(NotificationService);
  private readonly wm = inject(WindowManagerService);
  readonly i18n = inject(I18nService);

  readonly isOpen = computed(() => this.panels.active() === 'notifications');
  private readonly locale = 'en-US';

  close(): void {
    this.panels.close();
  }

  openFrom(appId: string, id: string): void {
    this.wm.open(appId);
    this.notifications.remove(id);
    this.close();
  }

  remove(id: string, event: Event): void {
    event.stopPropagation();
    this.notifications.remove(id);
  }

  clearAll(): void {
    this.notifications.clearAll();
  }

  relative(ts: number): string {
    return relativeFromNow(ts, this.locale);
  }
}
