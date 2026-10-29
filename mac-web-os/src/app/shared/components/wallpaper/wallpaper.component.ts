import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SettingsService } from '../../../core/services/settings.service';
import { getWallpaper } from '../../utils/wallpapers.data';

/** Full-bleed wallpaper layer with a built-in gradient fallback if the image fails to load. */
@Component({
  selector: 'mw-wallpaper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mw-wallpaper" [style.background]="gradient()">
      @if (!imageFailed()) {
        <img
          [src]="wallpaper().file"
          alt=""
          class="mw-wallpaper__img"
          [style.objectFit]="fit()"
          style="object-position: center"
          (error)="imageFailed.set(true)"
        />
      }
    </div>
  `,
  styles: [
    `
      :host {
        position: absolute;
        inset: 0;
        display: block;
        z-index: 0;
      }
      .mw-wallpaper {
        position: absolute;
        inset: 0;
        overflow: hidden;
      }
      .mw-wallpaper__img {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class WallpaperComponent {
  private readonly settings = inject(SettingsService);
  readonly imageFailed = signal(false);

  readonly wallpaper = computed(() => getWallpaper(this.settings.settings().wallpaperId));
  readonly gradient = computed(() => this.wallpaper().fallbackGradient);
  readonly fit = computed(() => {
    const fit = this.settings.settings().wallpaperFit;
    if (fit === 'fill') return 'fill';
    if (fit === 'contain') return 'contain';
    if (fit === 'center') return 'none';
    return 'cover';
  });
}
