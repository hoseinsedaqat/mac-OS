import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ClockService } from '../../core/services/clock.service';
import { SystemStateService } from '../../core/services/system-state.service';
import { SettingsService } from '../../core/services/settings.service';
import { WallpaperComponent } from '../../shared/components/wallpaper/wallpaper.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { formatFullDate, formatTime } from '../../shared/utils/date.util';

@Component({
  selector: 'mw-lock-screen',
  standalone: true,
  imports: [WallpaperComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lock-screen.component.html',
  styleUrl: './lock-screen.component.scss',
  host: {
    '(click)': 'unlock()',
    '(keydown.enter)': 'unlock()',
    tabindex: '0',
  },
})
export class LockScreenComponent {
  private readonly system = inject(SystemStateService);
  private readonly clock = inject(ClockService);
  readonly settings = inject(SettingsService);

  readonly time = computed(() => formatTime(this.clock.now(), this.settings.settings().use24HourClock));
  readonly date = computed(() => formatFullDate(this.clock.now()));

  unlock(): void {
    this.system.requestLogin();
  }
}
