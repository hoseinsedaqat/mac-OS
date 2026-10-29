import { Injectable, signal } from '@angular/core';

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
        confirmLabel: options.confirmLabel ?? 'تأیید',
        cancelLabel: options.cancelLabel ?? 'انصراف',
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
        confirmLabel: options.okLabel ?? 'باشه',
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
