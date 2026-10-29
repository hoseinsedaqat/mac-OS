import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Minimal, dependency-free SVG icon set used across the whole shell.
 * Each icon is a hand-authored path so the project does not depend on a
 * third-party icon package whose peer dependencies may lag behind the
 * Angular version in use.
 */
@Component({
  selector: 'mw-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg
    [attr.width]="size()"
    [attr.height]="size()"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    [attr.stroke-width]="strokeWidth()"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    [innerHTML]="path()"
  ></svg>`,
  styles: [
    `
      :host {
        display: inline-flex;
        line-height: 0;
      }
    `,
  ],
})
export class IconComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<string>();
  readonly size = input<number>(20);
  readonly strokeWidth = input<number>(1.8);

  // Using static, hand-written path fragments (no remote fetch, no eval).
  private readonly paths: Record<string, string> = {
    finder:
      '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" stroke="none" opacity="0.18"/><circle cx="9" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="11" r="1" fill="currentColor" stroke="none"/><path d="M8.5 15.5c1 .8 2.2 1.2 3.5 1.2s2.5-.4 3.5-1.2"/>',
    safari:
      '<circle cx="12" cy="12" r="9"/><path d="m15 9-4.5 3-1.5 4.5L13.5 15Z" fill="currentColor" stroke="none" opacity="0.7"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="8" cy="14.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="14.5" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="14.5" r="1" fill="currentColor" stroke="none"/>',
    notes:
      '<path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/><path d="M8 13h8M8 17h5"/>',
    photos:
      '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 17 5-5 4 4 3-3 5 5"/>',
    music: '<circle cx="7" cy="18" r="2.4"/><circle cx="17" cy="16" r="2.4"/><path d="M9.4 18V6.5L19.4 4v11.5"/>',
    calculator:
      '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><rect x="7.5" y="5" width="9" height="4" rx="0.8" fill="currentColor" stroke="none" opacity="0.5"/><circle cx="8.2" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="15.8" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="8.2" cy="17" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/><circle cx="15.8" cy="17" r="1" fill="currentColor" stroke="none"/>',
    terminal:
      '<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="m7 9 3.2 3L7 15"/><path d="M13 15h4"/>',
    settings:
      '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.8-1.4-2-3.4-2.1.6a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.3a7.6 7.6 0 0 0-2.6 1.5l-2.1-.6-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3L2.8 15l2 3.4 2.1-.6c.8.65 1.65 1.15 2.6 1.5l.5 2.3h4l.5-2.3c.95-.35 1.8-.85 2.6-1.5l2.1.6 2-3.4Z"/>',
    'app-store':
      '<rect x="3" y="3" width="18" height="18" rx="4.5"/><path d="M12 7v10M8.5 12 12 8.5 15.5 12"/>',
    trash:
      '<path d="M4 7h16"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/><path d="M6 7l1 13a2 2 0 0 0 2 1.8h6a2 2 0 0 0 2-1.8l1-13"/><path d="M10 11v6M14 11v6"/>',
    about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.6" r="1" fill="currentColor" stroke="none"/>',
    folder: '<path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4.2l1.6 2H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5Z"/>',
    'folder-download':
      '<path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4.2l1.6 2H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5Z"/><path d="M12 10.5v5M9.8 13.3l2.2 2.2 2.2-2.2"/>',
    hdd: '<rect x="2.5" y="7" width="19" height="10" rx="2"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/><path d="M10 12h8"/>',
    apps: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 17h12M7 17v-6a5 5 0 0 1 10 0v6"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    wifi: '<path d="M3 9a16 16 0 0 1 18 0"/><path d="M6.5 12.8a11 11 0 0 1 11 0"/><path d="M10 16.5a5.5 5.5 0 0 1 4 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none"/>',
    battery:
      '<rect x="2.5" y="8" width="17" height="8" rx="2"/><path d="M21.5 11v2"/><rect x="4.5" y="10" width="11" height="4" fill="currentColor" stroke="none" opacity="0.8"/>',
    volume: '<path d="M4 10v4h3.5L13 18V6L7.5 10Z"/><path d="M16.5 9a4 4 0 0 1 0 6"/><path d="M19 7a7.5 7.5 0 0 1 0 10"/>',
    'volume-mute': '<path d="M4 10v4h3.5L13 18V6L7.5 10Z"/><path d="m16.5 10 4 4m0-4-4 4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    chevronLeft: '<path d="m15 5-7 7 7 7"/>',
    chevronRight: '<path d="m9 5 7 7-7 7"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    grid: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    power: '<path d="M12 3v8"/><path d="M6.2 7.2a8 8 0 1 0 11.6 0"/>',
    play: '<path d="M7 5.5v13l11-6.5Z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6" y="5" width="4" height="14" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" fill="currentColor" stroke="none"/>',
    next: '<path d="M6 5.5v13L15 12Z" fill="currentColor" stroke="none"/><rect x="16.5" y="5.5" width="2" height="13" fill="currentColor" stroke="none"/>',
    prev: '<path d="M18 18.5v-13L9 12Z" fill="currentColor" stroke="none"/><rect x="5.5" y="5.5" width="2" height="13" fill="currentColor" stroke="none"/>',
    sparkles:
      '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
    trash2: '<path d="M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/><path d="M6 7l1 13a2 2 0 0 0 2 1.8h6a2 2 0 0 0 2-1.8l1-13"/>',
    user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    download: '<path d="M12 4v11M7.5 11 12 15.5 16.5 11"/><path d="M5 19.5h14"/>',
    upload: '<path d="M12 19.5v-11M7.5 12.5 12 8 16.5 12.5"/><path d="M5 19.5h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 14-5.2M20 12a8 8 0 0 1-14 5.2"/><path d="M18 3v4h-4M6 21v-4h4"/>',
    home: '<path d="m4 11 8-7 8 7"/><path d="M6 10v9.5a.5.5 0 0 0 .5.5H10v-5h4v5h3.5a.5.5 0 0 0 .5-.5V10"/>',
    star: '<path d="m12 3 2.6 5.8 6.2.6-4.7 4.2 1.4 6.1L12 16.9 6.5 19.7l1.4-6.1-4.7-4.2 6.2-.6Z"/>',
    bookmark: '<path d="M6 3.5h12v17l-6-4-6 4Z"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/>',
    send: '<path d="m4 11 16-7-6 16-3-6Z"/>',
    'file-text': '<path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/><path d="M8 13h8M8 17h5"/>',
    games:
      '<rect x="2.5" y="8" width="19" height="9.5" rx="4"/><path d="M7 10.5v4.5M4.8 12.75h4.4"/><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="18.2" cy="13.5" r="1" fill="currentColor" stroke="none"/>',
    vscode:
      '<path d="M16.5 2.5 6.3 11.4 2.5 8.6v6.8l3.8-2.8L16.5 21.5l4-1.9V4.4Z"/><path d="m16.5 8.6-6.9 3.4 6.9 3.4" opacity="0.55"/>',
    play2:
      '<path d="M4 12a8 8 0 1 1 8 8" /><path d="m4 12 3-3m-3 3 3 3"/>',
    grid3:
      '<rect x="3" y="3" width="5" height="5" rx="1"/><rect x="9.5" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="3" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><rect x="16" y="9.5" width="5" height="5" rx="1"/><rect x="3" y="16" width="5" height="5" rx="1"/><rect x="9.5" y="16" width="5" height="5" rx="1"/><rect x="16" y="16" width="5" height="5" rx="1"/>',
    joystick:
      '<circle cx="12" cy="7" r="3"/><path d="M12 10v5"/><rect x="5" y="15" width="14" height="6" rx="2"/>',
  };

  readonly path = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.paths[this.name()] ?? this.paths['about']),
  );
}
