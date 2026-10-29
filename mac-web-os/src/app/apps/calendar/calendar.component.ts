import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarEvent, CalendarStoreService } from './calendar-store.service';
import { DialogService } from '../../core/services/dialog.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { addMonths, buildMonthGrid, dateKey, formatFullDate, isSameDay } from '../../shared/utils/date.util';

const WEEKDAYS = ['یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه', 'شنبه'];
const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

@Component({
  selector: 'mw-app-calendar',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent {
  readonly windowId = input<string>('');
  readonly store = inject(CalendarStoreService);
  private readonly dialog = inject(DialogService);

  readonly weekdays = WEEKDAYS;
  readonly today = new Date();
  readonly viewMonth = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  readonly selectedDate = signal(new Date());

  readonly monthLabel = computed(() => MONTH_FORMATTER.format(this.viewMonth()));
  readonly grid = computed(() => buildMonthGrid(this.viewMonth()));
  readonly selectedKey = computed(() => dateKey(this.selectedDate()));
  readonly selectedEvents = computed(() => this.store.eventsFor(this.selectedKey()));
  readonly selectedDateLabel = computed(() => formatFullDate(this.selectedDate()));

  readonly formTitle = signal('');
  readonly formTime = signal('09:00');
  readonly formDescription = signal('');
  readonly editingId = signal<string | null>(null);

  prevMonth(): void {
    this.viewMonth.update((d) => addMonths(d, -1));
  }

  nextMonth(): void {
    this.viewMonth.update((d) => addMonths(d, 1));
  }

  goToday(): void {
    const now = new Date();
    this.viewMonth.set(new Date(now.getFullYear(), now.getMonth(), 1));
    this.selectedDate.set(now);
  }

  selectDay(day: Date): void {
    this.selectedDate.set(day);
    if (day.getMonth() !== this.viewMonth().getMonth()) {
      this.viewMonth.set(new Date(day.getFullYear(), day.getMonth(), 1));
    }
    this.resetForm();
  }

  isToday(day: Date): boolean {
    return isSameDay(day, this.today);
  }

  isSelected(day: Date): boolean {
    return isSameDay(day, this.selectedDate());
  }

  isCurrentMonth(day: Date): boolean {
    return day.getMonth() === this.viewMonth().getMonth();
  }

  eventCount(day: Date): number {
    return this.store.countFor(dateKey(day));
  }

  resetForm(): void {
    this.formTitle.set('');
    this.formTime.set('09:00');
    this.formDescription.set('');
    this.editingId.set(null);
  }

  editEvent(event: CalendarEvent): void {
    this.editingId.set(event.id);
    this.formTitle.set(event.title);
    this.formTime.set(event.time);
    this.formDescription.set(event.description);
  }

  saveEvent(): void {
    const title = this.formTitle().trim();
    if (!title) return;
    const payload = {
      dateKey: this.selectedKey(),
      title,
      time: this.formTime() || '00:00',
      description: this.formDescription().trim(),
    };
    const editing = this.editingId();
    if (editing) {
      this.store.update(editing, payload);
    } else {
      this.store.create(payload);
    }
    this.resetForm();
  }

  async deleteEvent(event: CalendarEvent): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'حذف رویداد',
      message: `آیا از حذف «${event.title}» مطمئن هستید؟`,
      confirmLabel: 'حذف',
      danger: true,
    });
    if (confirmed) {
      this.store.remove(event.id);
      if (this.editingId() === event.id) this.resetForm();
    }
  }
}
