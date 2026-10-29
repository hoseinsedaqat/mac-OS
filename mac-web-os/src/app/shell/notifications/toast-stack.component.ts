import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { I18nService } from '../../core/services/i18n.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'mw-toast-stack',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mw-toasts">
      @for (toast of notifications.toasts(); track toast.id) {
        <div class="mw-toast" role="status">
          <mw-icon [name]="toast.icon" [size]="18" />
          <div class="mw-toast__body">
            <strong>{{ toast.appName }}</strong>
            <p>{{ toast.title }}</p>
            <span>{{ toast.body }}</span>
          </div>
          <button type="button" [attr.aria-label]="i18n.t('common.close')" (click)="notifications.dismissToast(toast.id)">
            <mw-icon name="close" [size]="12" />
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast-stack.component.scss',
})
export class ToastStackComponent {
  readonly notifications = inject(NotificationService);
  readonly i18n = inject(I18nService);
}
