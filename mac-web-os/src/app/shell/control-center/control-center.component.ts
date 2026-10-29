import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PanelService } from '../../core/services/panel.service';
import { SettingsService } from '../../core/services/settings.service';
import { I18nService } from '../../core/services/i18n.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'mw-control-center',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './control-center.component.html',
  styleUrl: './control-center.component.scss',
})
export class ControlCenterComponent {
  private readonly panels = inject(PanelService);
  readonly settings = inject(SettingsService);
  readonly i18n = inject(I18nService);

  readonly isOpen = computed(() => this.panels.active() === 'control-center');

  close(): void {
    this.panels.close();
  }

  toggleWifi(): void {
    this.settings.update({ wifiEnabled: !this.settings.settings().wifiEnabled });
  }

  toggleFocus(): void {
    this.settings.update({ focusMode: !this.settings.settings().focusMode });
  }

  toggleTheme(): void {
    this.settings.toggleTheme();
  }

  toggleDockAutoHide(): void {
    this.settings.update({ dockAutoHide: !this.settings.settings().dockAutoHide });
  }

  setVolume(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.settings.update({ volume: value, soundEnabled: value > 0 });
  }

  setBrightness(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.settings.update({ brightness: value });
  }

  setDockSize(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.settings.update({ dockSize: value });
  }

  setLanguage(lang: 'en' | 'fa'): void {
    this.i18n.setLanguage(lang);
  }
}
