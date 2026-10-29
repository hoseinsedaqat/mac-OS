import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { ApplicationRegistryService } from '../../core/services/application-registry.service';

const ANGULAR_VERSION = '22';
const OS_VERSION = '1.0.0';

@Component({
  selector: 'mw-app-about',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  readonly windowId = input<string>('');
  private readonly wm = inject(WindowManagerService);
  private readonly registry = inject(ApplicationRegistryService);

  readonly angularVersion = ANGULAR_VERSION;
  readonly osVersion = OS_VERSION;
  readonly openWindowCount = computed(() => this.wm.windows().length);
  readonly installedAppsCount = this.registry.list().length;
  readonly storageEstimate = signal<string>('Calculating…');

  constructor() {
    this.loadStorage();
  }

  private async loadStorage(): Promise<void> {
    if (!navigator.storage?.estimate) {
      this.storageEstimate.set('Unknown (not supported)');
      return;
    }
    try {
      const estimate = await navigator.storage.estimate();
      const usageMb = ((estimate.usage ?? 0) / (1024 * 1024)).toFixed(2);
      const quotaMb = ((estimate.quota ?? 0) / (1024 * 1024)).toFixed(0);
      this.storageEstimate.set(`${usageMb} MB of ~${quotaMb} MB (simulated by browser)`);
    } catch {
      this.storageEstimate.set('Unknown');
    }
  }
}
