import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'mw-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (dialog.request(); as req) {
      <div class="mw-dialog-scrim" (keydown.escape)="dialog.respond(false)">
        <div class="mw-dialog" role="alertdialog" aria-modal="true" [attr.aria-label]="req.title">
          <h2>{{ req.title }}</h2>
          <p>{{ req.message }}</p>
          <div class="mw-dialog__actions">
            @if (req.cancelLabel) {
              <button type="button" class="mw-btn" (click)="dialog.respond(false)">
                {{ req.cancelLabel }}
              </button>
            }
            <button
              type="button"
              class="mw-btn"
              [class.mw-btn-accent]="!req.danger"
              [class.mw-btn-danger]="req.danger"
              (click)="dialog.respond(true)"
              #confirmBtn
            >
              {{ req.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  readonly dialog = inject(DialogService);
}
