import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { SystemStateService } from '../../core/services/system-state.service';
import { I18nService } from '../../core/services/i18n.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

const RESTART_DELAY_MS = 1800;

/**
 * Brief "Restarting…" screen shown between closing the desktop session and
 * replaying the boot animation. Purely cosmetic/simulated — no real reboot
 * happens, it only resets the in-app session state.
 */
@Component({
  selector: 'mw-restart-screen',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mw-restart">
      <div class="mw-restart__logo">
        <mw-icon name="apple" [size]="72" />
      </div>
      <div class="mw-restart__spinner" aria-hidden="true"></div>
      <p class="mw-restart__label">{{ i18n.t('shell.restart.inProgress') }}</p>
    </div>
  `,
  styleUrl: './restart-screen.component.scss',
})
export class RestartScreenComponent implements OnInit, OnDestroy {
  private readonly system = inject(SystemStateService);
  readonly i18n = inject(I18nService);
  private timeout: ReturnType<typeof setTimeout> | null = null;

  readonly done = signal(false);

  ngOnInit(): void {
    this.timeout = setTimeout(() => {
      this.done.set(true);
      this.system.rebootToSplash();
    }, RESTART_DELAY_MS);
  }

  ngOnDestroy(): void {
    if (this.timeout) clearTimeout(this.timeout);
  }
}
