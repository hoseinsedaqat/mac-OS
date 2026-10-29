import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PanelService } from '../../core/services/panel.service';
import { SettingsService } from '../../core/services/settings.service';
import { I18nService } from '../../core/services/i18n.service';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { DesktopService } from '../../core/services/desktop.service';
import { NotificationService } from '../../core/services/notification.service';
import { FileSystemService } from '../../core/services/file-system.service';
import { DOCUMENTS_ID } from '../../core/models/file-system.model';
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
  private readonly wm = inject(WindowManagerService);
  private readonly desktop = inject(DesktopService);
  private readonly notifications = inject(NotificationService);
  private readonly fs = inject(FileSystemService);

  readonly isOpen = computed(() => this.panels.active() === 'control-center');

  close(): void {
    this.panels.close();
  }

  toggleWifi(): void {
    this.settings.update({ wifiEnabled: !this.settings.settings().wifiEnabled });
  }

  toggleBluetooth(): void {
    this.settings.update({ bluetoothEnabled: !this.settings.settings().bluetoothEnabled });
  }

  toggleFocus(): void {
    this.settings.update({ focusMode: !this.settings.settings().focusMode });
  }

  toggleStageManager(): void {
    this.settings.update({ stageManagerEnabled: !this.settings.settings().stageManagerEnabled });
  }

  toggleScreenMirroring(): void {
    this.settings.update({ screenMirroringEnabled: !this.settings.settings().screenMirroringEnabled });
  }

  toggleAirdrop(): void {
    const next = !this.settings.settings().airdropEnabled;
    this.settings.update({ airdropEnabled: next });
    this.toast(
      'airdrop',
      this.i18n.t('shell.controlCenter.airdrop'),
      next ? this.i18n.t('shell.controlCenter.toasts.airdropOn') : this.i18n.t('shell.controlCenter.toasts.airdropOff'),
    );
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

  setKeyboardBrightness(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.settings.update({ keyboardBrightness: value });
  }

  setDockSize(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.settings.update({ dockSize: value });
  }

  openMusic(): void {
    this.wm.open('music');
    this.close();
  }

  openCalculator(): void {
    this.wm.open('calculator');
    this.close();
  }

  recogniseMusic(): void {
    this.toast('music', this.i18n.t('shell.controlCenter.recogniseMusic'), this.i18n.t('shell.controlCenter.toasts.recognise'));
  }

  resetIcons(): void {
    this.desktop.resetPositions();
    this.toast('history', this.i18n.t('shell.controlCenter.quick.resetIcons'), this.i18n.t('shell.controlCenter.toasts.resetIcons'));
  }

  toggleScreenRecording(): void {
    const next = !this.settings.settings().screenRecordingActive;
    this.settings.update({ screenRecordingActive: next });
    this.toast(
      'rec',
      this.i18n.t('shell.controlCenter.quick.screenRecording'),
      next ? this.i18n.t('shell.controlCenter.toasts.recordingOn') : this.i18n.t('shell.controlCenter.toasts.recordingOff'),
    );
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(location.href);
      this.toast('upload', this.i18n.t('shell.controlCenter.quick.copyLink'), this.i18n.t('shell.controlCenter.toasts.linkCopied'));
    } catch {
      this.toast('upload', this.i18n.t('shell.controlCenter.quick.copyLink'), this.i18n.t('shell.controlCenter.toasts.linkCopyFailed'));
    }
  }

  async takeScreenshot(): Promise<void> {
    const name = `Screenshot ${new Date().toLocaleString()}.png`;
    await this.fs.createFile(
      DOCUMENTS_ID,
      name,
      'Simulated screenshot placeholder — MacWeb OS never captures your real screen.',
    );
    this.toast('crop', this.i18n.t('shell.controlCenter.quick.screenshot'), this.i18n.t('shell.controlCenter.toasts.screenshotSaved'));
  }

  showDesktop(): void {
    this.wm.minimizeAll();
    this.close();
  }

  editControls(): void {
    this.wm.open('settings');
    this.close();
  }

  private toast(icon: string, title: string, body: string): void {
    this.notifications.push({ appId: 'control-center', appName: this.i18n.t('shell.controlCenter.title'), icon, title, body });
  }
}
