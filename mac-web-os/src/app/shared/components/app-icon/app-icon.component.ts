import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/**
 * Renders a single "app tile": a rounded-square gradient background (in the
 * style of macOS app icons) with either a line-art glyph (reusing the shared
 * `mw-icon` set) or a short text glyph on top. Used by the Launchpad grid and
 * the App Store. Entirely original artwork — no Apple icon assets are used.
 */
@Component({
  selector: 'mw-app-icon',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mw-app-icon" [style.background]="background()" [style.width.px]="size()" [style.height.px]="size()">
      @if (text(); as t) {
        <span class="mw-app-icon__text" [style.color]="glyphColor()" [style.font-size.px]="size() * 0.38">{{ t }}</span>
      } @else {
        <mw-icon [name]="glyph()" [size]="size() * 0.5" [style.color]="glyphColor()" />
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        line-height: 0;
      }

      .mw-app-icon {
        display: grid;
        place-items: center;
        border-radius: 22%;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.25),
          0 2px 6px rgba(0, 0, 0, 0.25);
        color: #fff;
      }

      .mw-app-icon__text {
        font-weight: 700;
        letter-spacing: -0.02em;
      }
    `,
  ],
})
export class AppIconComponent {
  readonly background = input<string>('linear-gradient(160deg, #8e8e93, #48484a)');
  readonly glyph = input<string>('apps');
  readonly glyphColor = input<string>('#fff');
  readonly text = input<string | null>(null);
  readonly size = input<number>(64);
}
