import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from '../../core/services/storage.service';
import { createId } from '../../shared/utils/id.util';
import { dateKey } from '../../shared/utils/date.util';

export interface CalendarEvent {
  id: string;
  dateKey: string;
  title: string;
  description: string;
  time: string;
}

const EVENTS_KEY = 'calendar-events';

@Injectable({ providedIn: 'root' })
export class CalendarStoreService {
  private readonly storage = inject(StorageService);
  private readonly eventsSignal = signal<CalendarEvent[]>(this.load());
  readonly events = this.eventsSignal.asReadonly();

  constructor() {
    if (this.eventsSignal().length === 0) this.seed();
  }

  private load(): CalendarEvent[] {
    return this.storage.getItem<CalendarEvent[]>(EVENTS_KEY, []);
  }

  private persist(): void {
    this.storage.setItem(EVENTS_KEY, this.eventsSignal());
  }

  private seed(): void {
    const today = new Date();
    const seeded: CalendarEvent[] = [
      {
        id: createId('event'),
        dateKey: dateKey(today),
        title: 'خوش‌آمدگویی به MacWeb OS',
        description: 'یک رویداد نمونه برای آشنایی با تقویم.',
        time: '10:00',
      },
    ];
    this.eventsSignal.set(seeded);
    this.persist();
  }

  eventsFor(key: string): CalendarEvent[] {
    return this.eventsSignal()
      .filter((e) => e.dateKey === key)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  countFor(key: string): number {
    return this.eventsSignal().filter((e) => e.dateKey === key).length;
  }

  create(event: Omit<CalendarEvent, 'id'>): void {
    this.eventsSignal.update((list) => [...list, { ...event, id: createId('event') }]);
    this.persist();
  }

  update(id: string, patch: Partial<Omit<CalendarEvent, 'id'>>): void {
    this.eventsSignal.update((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    this.persist();
  }

  remove(id: string): void {
    this.eventsSignal.update((list) => list.filter((e) => e.id !== id));
    this.persist();
  }
}
