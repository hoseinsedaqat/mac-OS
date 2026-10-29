import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { SystemStateService } from '../../core/services/system-state.service';
import { I18nService } from '../../core/services/i18n.service';

/**
 * Simulated "powered off" screen: a plain black screen, same spirit as a
 * real Mac's display when shut down. Since this is an in-browser simulation
 * (we cannot actually close the tab for the user), clicking anywhere or
 * pressing any key turns the machine back on and replays the boot sequence —
 * this is clearly disclosed via the on-screen hint.
 */
@Component({
  selector: 'mw-power-off-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mw-poweroff" (click)="turnOn()">
      <p class="mw-poweroff__hint">{{ i18n.t('shell.shutdown.turnOnHint') }}</p>
    </div>
  `,
  styleUrl: './power-off-screen.component.scss',
})
export class PowerOffScreenComponent {
  private readonly system = inject(SystemStateService);
  readonly i18n = inject(I18nService);

  @HostListener('document:keydown')
  onAnyKey(): void {
    this.turnOn();
  }

  turnOn(): void {
    this.system.rebootToSplash();
  }
}
