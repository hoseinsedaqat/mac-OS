import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SystemStateService } from '../../core/services/system-state.service';
import { SettingsService } from '../../core/services/settings.service';
import { SoundService } from '../../core/services/sound.service';
import { WallpaperComponent } from '../../shared/components/wallpaper/wallpaper.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

/** Simulated, locally-verified hash – never a real security mechanism. */
async function simpleHash(value: string): Promise<string> {
  try {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    // Fallback for environments without SubtleCrypto: still local-only, never sent anywhere.
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }
}

@Component({
  selector: 'mw-login',
  standalone: true,
  imports: [FormsModule, WallpaperComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  host: {
    '(keydown.escape)': 'cancel()',
  },
})
export class LoginComponent {
  private readonly system = inject(SystemStateService);
  private readonly sound = inject(SoundService);
  readonly settings = inject(SettingsService);

  readonly password = signal('');
  readonly error = signal(false);
  readonly submitting = signal(false);
  readonly passwordEnabled = computed(() => this.settings.settings().passwordEnabled);

  async submit(): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(false);

    if (this.passwordEnabled()) {
      const hash = await simpleHash(this.password());
      if (hash !== this.settings.settings().passwordHash) {
        this.error.set(true);
        this.submitting.set(false);
        this.sound.error();
        this.password.set('');
        return;
      }
    }

    this.sound.unlock();
    this.system.completeLogin();
  }

  cancel(): void {
    this.password.set('');
    this.error.set(false);
    this.system.cancelLogin();
  }
}
