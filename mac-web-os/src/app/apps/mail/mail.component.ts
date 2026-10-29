import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MailFolder, MailMessage, MailStoreService } from './mail-store.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { relativeFromNow } from '../../shared/utils/date.util';

@Component({
  selector: 'mw-app-mail',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mail.component.html',
  styleUrl: './mail.component.scss',
})
export class MailComponent {
  readonly windowId = input<string>('');
  readonly store = inject(MailStoreService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(DialogService);

  readonly folder = signal<MailFolder>('inbox');
  readonly selectedId = signal<string | null>(null);
  readonly query = signal('');
  readonly composing = signal(false);

  readonly composeTo = signal('');
  readonly composeSubject = signal('');
  readonly composeBody = signal('');

  readonly list = computed<MailMessage[]>(() =>
    this.query().trim() ? this.store.search(this.query()) : this.store.byFolder(this.folder()),
  );

  readonly selected = computed<MailMessage | null>(
    () => this.list().find((m) => m.id === this.selectedId()) ?? null,
  );

  readonly unreadInbox = computed(() => this.store.byFolder('inbox').filter((m) => !m.read).length);

  selectFolder(folder: MailFolder): void {
    this.folder.set(folder);
    this.selectedId.set(null);
    this.composing.set(false);
  }

  openMessage(message: MailMessage): void {
    this.selectedId.set(message.id);
    this.composing.set(false);
    if (!message.read) this.store.markRead(message.id);
  }

  startCompose(): void {
    this.composing.set(true);
    this.selectedId.set(null);
    this.composeTo.set('');
    this.composeSubject.set('');
    this.composeBody.set('');
  }

  saveDraft(): void {
    if (!this.composeTo() && !this.composeSubject() && !this.composeBody()) return;
    this.store.saveDraft({ to: this.composeTo(), subject: this.composeSubject(), body: this.composeBody() });
    this.composing.set(false);
    this.selectFolder('drafts');
  }

  send(): void {
    this.store.send({ to: this.composeTo(), subject: this.composeSubject(), body: this.composeBody() });
    this.notifications.push({
      appId: 'mail',
      appName: 'Mail (Demo)',
      icon: 'mail',
      title: 'Email Simulated',
      body: `Email to "${this.composeTo() || 'Unknown Recipient'}" was sent in demo mode (no real connection).`,
    });
    this.composing.set(false);
    this.selectFolder('sent');
  }

  async deleteMessage(message: MailMessage): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Delete Message',
      message: `Are you sure you want to delete "${message.subject}"?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (confirmed) {
      this.store.remove(message.id);
      if (this.selectedId() === message.id) this.selectedId.set(null);
    }
  }

  relative(ts: number): string {
    return relativeFromNow(ts);
  }
}
