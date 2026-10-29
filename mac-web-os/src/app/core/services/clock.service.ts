import { Injectable, OnDestroy, signal } from '@angular/core';

/**
 * Single shared ticking clock. Every component that needs "now" (menu bar,
 * lock screen, Calendar "today" highlight) reads this signal instead of
 * starting its own `setInterval`, so the whole app only ever has one timer.
 */
@Injectable({ providedIn: 'root' })
export class ClockService implements OnDestroy {
  private readonly nowSignal = signal(new Date());
  readonly now = this.nowSignal.asReadonly();

  private readonly timer = setInterval(() => this.nowSignal.set(new Date()), 1000);

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
