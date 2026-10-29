import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { SystemStateService } from '../../core/services/system-state.service';
import { I18nService } from '../../core/services/i18n.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

const STEP_COUNT = 5;

@Component({
  selector: 'mw-boot',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './boot.component.html',
  styleUrl: './boot.component.scss',
})
export class BootComponent implements OnInit, OnDestroy {
  private readonly system = inject(SystemStateService);
  readonly i18n = inject(I18nService);

  readonly state = this.system.state;
  readonly splashProgress = signal(0);
  readonly bootProgress = signal(0);
  readonly canSkip = signal(false);
  private readonly stepIndex = signal(0);

  readonly stepLabel = computed(() => this.i18n.list('shell.boot.steps')[this.stepIndex()] ?? '');

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
    this.stepIndex.set(0);
    const interval = setInterval(() => {
      this.bootProgress.update((v) => {
        const next = Math.min(100, v + 2.2);
        const expectedStep = Math.min(STEP_COUNT - 1, Math.floor((next / 100) * STEP_COUNT));
        if (expectedStep !== this.stepIndex()) {
          this.stepIndex.set(expectedStep);
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
