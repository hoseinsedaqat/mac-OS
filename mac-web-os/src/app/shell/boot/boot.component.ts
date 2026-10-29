import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { SystemStateService } from '../../core/services/system-state.service';

const BOOT_STEPS = [
  'بررسی سخت‌افزار شبیه‌سازی‌شده…',
  'بارگذاری هسته MacWeb OS…',
  'آماده‌سازی فضای ذخیره‌سازی محلی…',
  'بررسی برنامه‌های نصب‌شده…',
  'آماده‌سازی صفحه ورود…',
];

@Component({
  selector: 'mw-boot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './boot.component.html',
  styleUrl: './boot.component.scss',
})
export class BootComponent implements OnInit, OnDestroy {
  private readonly system = inject(SystemStateService);

  readonly state = this.system.state;
  readonly splashProgress = signal(0);
  readonly bootProgress = signal(0);
  readonly canSkip = signal(false);
  readonly stepLabel = signal(BOOT_STEPS[0]);

  private timers: ReturnType<typeof setInterval>[] = [];
  private timeouts: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    this.runSplash();
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearInterval);
    this.timeouts.forEach(clearTimeout);
  }

  private runSplash(): void {
    this.timeouts.push(setTimeout(() => this.canSkip.set(true), 900));
    const interval = setInterval(() => {
      this.splashProgress.update((v) => {
        const next = Math.min(100, v + 4);
        if (next >= 100) {
          clearInterval(interval);
          this.goToBooting();
        }
        return next;
      });
    }, 60);
    this.timers.push(interval);
  }

  skipSplash(): void {
    if (!this.canSkip() || this.state() !== 'splash') return;
    this.timers.forEach(clearInterval);
    this.goToBooting();
  }

  private goToBooting(): void {
    if (this.state() !== 'splash') return;
    this.system.startBooting();
    this.runBootSequence();
  }

  private runBootSequence(): void {
    let stepIndex = 0;
    this.stepLabel.set(BOOT_STEPS[0]);
    const interval = setInterval(() => {
      this.bootProgress.update((v) => {
        const next = Math.min(100, v + 2.2);
        const expectedStep = Math.min(
          BOOT_STEPS.length - 1,
          Math.floor((next / 100) * BOOT_STEPS.length),
        );
        if (expectedStep !== stepIndex) {
          stepIndex = expectedStep;
          this.stepLabel.set(BOOT_STEPS[stepIndex]);
        }
        if (next >= 100) {
          clearInterval(interval);
          this.timeouts.push(setTimeout(() => this.system.finishBooting(), 350));
        }
        return next;
      });
    }, 70);
    this.timers.push(interval);
  }
}
