import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from '../../core/services/storage.service';
import { createId } from '../../shared/utils/id.util';

export type MailFolder = 'inbox' | 'sent' | 'drafts';

export interface MailMessage {
  id: string;
  folder: MailFolder;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: number;
  read: boolean;
}

const KEY = 'mail-messages';

@Injectable({ providedIn: 'root' })
export class MailStoreService {
  private readonly storage = inject(StorageService);
  private readonly messagesSignal = signal<MailMessage[]>(this.load());
  readonly messages = this.messagesSignal.asReadonly();

  constructor() {
    if (this.messagesSignal().length === 0) this.seed();
  }

  private load(): MailMessage[] {
    return this.storage.getItem<MailMessage[]>(KEY, []);
  }

  private persist(): void {
    this.storage.setItem(KEY, this.messagesSignal());
  }

  private seed(): void {
    const now = Date.now();
    const sample: MailMessage[] = [
      {
        id: createId('mail'),
        folder: 'inbox',
        from: 'team@macweb-os.demo',
        to: 'you@macweb-os.demo',
        subject: 'Welcome to MacWeb OS',
        body: 'Hi!\n\nThis is a sample email in Demo mode. Since this project runs without a backend, sending and receiving real email is not supported.',
        date: now - 1000 * 60 * 60 * 5,
        read: false,
      },
      {
        id: createId('mail'),
        folder: 'inbox',
        from: 'notifications@macweb-os.demo',
        to: 'you@macweb-os.demo',
        subject: 'Weekly System Report (sample)',
        body: 'This is another simulated email showing off Mail features.',
        date: now - 1000 * 60 * 60 * 30,
        read: true,
      },
    ];
    this.messagesSignal.set(sample);
    this.persist();
  }

  byFolder(folder: MailFolder): MailMessage[] {
    return this.messagesSignal()
      .filter((m) => m.folder === folder)
      .sort((a, b) => b.date - a.date);
  }

  markRead(id: string): void {
    this.messagesSignal.update((list) => list.map((m) => (m.id === id ? { ...m, read: true } : m)));
    this.persist();
  }

  remove(id: string): void {
    this.messagesSignal.update((list) => list.filter((m) => m.id !== id));
    this.persist();
  }

  saveDraft(draft: { to: string; subject: string; body: string }): void {
    const message: MailMessage = {
      id: createId('mail'),
      folder: 'drafts',
      from: 'you@macweb-os.demo',
      to: draft.to,
      subject: draft.subject || '(No Subject)',
      body: draft.body,
      date: Date.now(),
      read: true,
    };
    this.messagesSignal.update((list) => [message, ...list]);
    this.persist();
  }

  /** Simulates sending: moves the draft into Sent – no network call is made. */
  send(draft: { to: string; subject: string; body: string }): void {
    const message: MailMessage = {
      id: createId('mail'),
      folder: 'sent',
      from: 'you@macweb-os.demo',
      to: draft.to || '(Unknown Recipient)',
      subject: draft.subject || '(No Subject)',
      body: draft.body,
      date: Date.now(),
      read: true,
    };
    this.messagesSignal.update((list) => [message, ...list]);
    this.persist();
  }

  search(query: string): MailMessage[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return this.messagesSignal().filter(
      (m) => m.subject.toLowerCase().includes(q) || m.body.toLowerCase().includes(q) || m.from.toLowerCase().includes(q),
    );
  }
}
