import { Injectable, inject, signal } from '@angular/core';
import { I18nService } from './i18n.service';

export interface ConfirmDialogRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string | null;
  danger: boolean;
  resolve: (value: boolean) => void;
}

/** Promise-based confirmation dialog so destructive actions always require an explicit choice. */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly i18n = inject(I18nService);
  readonly request = signal<ConfirmDialogRequest | null>(null);

  confirm(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
  }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.request.set({
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? this.i18n.t('common.confirm'),
        cancelLabel: options.cancelLabel ?? this.i18n.t('common.cancel'),
        danger: options.danger ?? false,
        resolve,
      });
    });
  }

  alert(options: { title: string; message: string; okLabel?: string }): Promise<void> {
    return new Promise<void>((resolve) => {
      this.request.set({
        title: options.title,
        message: options.message,
        confirmLabel: options.okLabel ?? this.i18n.t('common.ok'),
        cancelLabel: null,
        danger: false,
        resolve: () => resolve(),
      });
    });
  }

  respond(value: boolean): void {
    this.request()?.resolve(value);
    this.request.set(null);
  }
}
