import { Injectable, inject, signal } from '@angular/core';
import { SoundService } from './sound.service';

export type OverlayPanel = 'none' | 'spotlight' | 'control-center' | 'notifications' | 'launchpad';

/** Ensures only one of Spotlight / Control Center / Notification Center is open at a time. */
@Injectable({ providedIn: 'root' })
export class PanelService {
  private readonly sound = inject(SoundService);
  readonly active = signal<OverlayPanel>('none');

  toggle(panel: OverlayPanel): void {
    this.sound.click();
    this.active.update((current) => (current === panel ? 'none' : panel));
  }

  open(panel: OverlayPanel): void {
    this.sound.click();
    this.active.set(panel);
  }

  close(): void {
    this.active.set('none');
  }
}
