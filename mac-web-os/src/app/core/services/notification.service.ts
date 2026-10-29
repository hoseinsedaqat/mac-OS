import { Injectable, inject, signal } from '@angular/core';
import { SystemNotification } from '../models/notification.model';
import { createId } from '../../shared/utils/id.util';
import { SoundService } from './sound.service';

export interface PushNotificationInput {
  appId: string;
  appName: string;
  icon: string;
  title: string;
  body: string;
}

/**
 * Notification Center + transient toast queue.
 * Entirely in-memory: notifications are simulated system events, not
 * something that should survive a hard refresh.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly sound = inject(SoundService);
  private readonly notificationsSignal = signal<SystemNotification[]>([]);
  private readonly toastsSignal = signal<SystemNotification[]>([]);

  readonly notifications = this.notificationsSignal.asReadonly();
  readonly toasts = this.toastsSignal.asReadonly();
  readonly unreadCount = signal(0);

  push(input: PushNotificationInput): void {
    const notification: SystemNotification = {
      id: createId('notif'),
      createdAt: Date.now(),
      read: false,
      ...input,
    };
    this.notificationsSignal.update((list) => [notification, ...list].slice(0, 50));
    this.unreadCount.update((count) => count + 1);
    this.toastsSignal.update((list) => [...list, notification]);
    this.sound.notify();
    setTimeout(() => this.dismissToast(notification.id), 5000);
  }

  dismissToast(id: string): void {
    this.toastsSignal.update((list) => list.filter((n) => n.id !== id));
  }

  remove(id: string): void {
    this.notificationsSignal.update((list) => list.filter((n) => n.id !== id));
  }

  clearAll(): void {
    this.notificationsSignal.set([]);
    this.unreadCount.set(0);
  }

  markAllRead(): void {
    this.notificationsSignal.update((list) => list.map((n) => ({ ...n, read: true })));
    this.unreadCount.set(0);
  }
}
