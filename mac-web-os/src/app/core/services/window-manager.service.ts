import { Injectable, computed, signal } from '@angular/core';
import { OpenWindowOptions, Rect, WindowState } from '../models/window.model';
import { ApplicationRegistryService } from './application-registry.service';
import { createId } from '../../shared/utils/id.util';
import { clamp } from '../../shared/utils/clamp.util';
import { SoundService } from './sound.service';

const MENU_BAR_HEIGHT = 32;
const DOCK_RESERVED = 92;

@Injectable({ providedIn: 'root' })
export class WindowManagerService {
  private readonly windowsSignal = signal<WindowState[]>([]);
  private zCounter = 10;
  private cascadeOffset = 0;

  readonly windows = this.windowsSignal.asReadonly();
  readonly activeWindow = computed(() => this.windowsSignal().find((w) => w.active) ?? null);
  readonly visibleWindows = computed(() => this.windowsSignal().filter((w) => !w.minimized));
  readonly minimizedWindows = computed(() => this.windowsSignal().filter((w) => w.minimized));
  /** True when the frontmost window is maximized — used to auto-hide the Dock, like real macOS. */
  readonly isFullscreenActive = computed(() => {
    const active = this.activeWindow();
    return !!active && active.maximized;
  });

  constructor(
    private readonly registry: ApplicationRegistryService,
    private readonly sound: SoundService,
  ) {
    // Keep maximized windows filling the whole screen if the viewport itself
    // changes size (e.g. the browser window is resized).
    window.addEventListener('resize', () => this.resyncMaximizedWindows());
  }

  private resyncMaximizedWindows(): void {
    const viewport = this.viewportSize();
    const fullRect: Rect = { x: 0, y: MENU_BAR_HEIGHT, width: viewport.width, height: viewport.height - MENU_BAR_HEIGHT };
    this.windowsSignal.update((list) =>
      list.map((w) => {
        if (w.maximized) return { ...w, rect: fullRect };
        // The viewport shrank below this window's comfortable minimum size —
        // a tablet rotated to portrait, or the browser window resized much
        // narrower — so snap it to fullscreen instead of leaving it
        // overflowing or needing the user to scroll to reach its own
        // controls. This is also what makes windows behave sensibly on
        // phone-sized touch screens without any device/UA sniffing.
        if (!this.fitsComfortably(w.minSize.width, w.minSize.height, viewport)) {
          return { ...w, maximized: true, restoreRect: w.rect, rect: fullRect };
        }
        return w;
      }),
    );
  }

  /** True when `viewport` has enough room for a window of at least `minWidth`x`minHeight` plus breathing room for the menu bar and window chrome. */
  private fitsComfortably(minWidth: number, minHeight: number, viewport: { width: number; height: number }): boolean {
    return viewport.width >= minWidth + 16 && viewport.height >= minHeight + MENU_BAR_HEIGHT + 16;
  }

  isOpen(appId: string): boolean {
    return this.windowsSignal().some((w) => w.appId === appId);
  }

  windowsForApp(appId: string): WindowState[] {
    return this.windowsSignal().filter((w) => w.appId === appId);
  }

  /** Opens an app window, honoring single-instance apps by focusing the existing window instead. */
  open(appId: string, options: OpenWindowOptions = {}): string | null {
    const def = this.registry.get(appId);
    if (!def) return null;

    if (def.singleInstance && !options.forceNew) {
      const existing = this.windowsForApp(appId)[0];
      if (existing) {
        if (existing.minimized) this.restore(existing.id);
        this.focus(existing.id);
        if (options.data) {
          this.updateData(existing.id, options.data);
        }
        return existing.id;
      }
    }

    const viewport = this.viewportSize();
    const width = options.rect?.width ?? def.window.width;
    const height = options.rect?.height ?? def.window.height;
    const baseX = Math.max(24, Math.round((viewport.width - width) / 2));
    const baseY = Math.max(MENU_BAR_HEIGHT + 24, Math.round((viewport.height - height) / 2) - 20);
    this.cascadeOffset = (this.cascadeOffset + 1) % 6;
    const offset = this.cascadeOffset * 24;

    const rect: Rect = {
      x: clamp(baseX + offset - (options.rect?.x !== undefined ? 0 : 60), 8, Math.max(8, viewport.width - width - 8)),
      y: clamp(baseY + offset - 60, MENU_BAR_HEIGHT + 4, Math.max(MENU_BAR_HEIGHT + 4, viewport.height - height - DOCK_RESERVED)),
      width,
      height,
      ...options.rect,
    };

    // On a viewport too small to comfortably fit this app's own minimum
    // window size — a phone, a small tablet in portrait, or simply a narrow
    // browser window — open it filling the screen below the menu bar
    // instead of a floating window that would overflow or need horizontal
    // scrolling to reach its own titlebar/controls. The app still "remembers"
    // its normal floating size in `restoreRect`, used if it's ever unmaximized.
    const forceFullscreen = !options.rect && !this.fitsComfortably(def.window.minWidth, def.window.minHeight, viewport);
    const fullRect: Rect = { x: 0, y: MENU_BAR_HEIGHT, width: viewport.width, height: viewport.height - MENU_BAR_HEIGHT };

    const win: WindowState = {
      id: createId('win'),
      appId,
      title: options.title ?? def.name,
      rect: forceFullscreen ? fullRect : rect,
      restoreRect: forceFullscreen ? rect : null,
      minSize: { width: def.window.minWidth, height: def.window.minHeight },
      resizable: def.window.resizable,
      minimized: false,
      maximized: forceFullscreen,
      active: true,
      zIndex: ++this.zCounter,
      data: options.data ?? {},
      icon: def.icon,
      createdAt: Date.now(),
    };

    this.windowsSignal.update((list) => [...this.deactivateAll(list), win]);
    this.sound.open();
    return win.id;
  }

  private deactivateAll(list: WindowState[]): WindowState[] {
    return list.map((w) => (w.active ? { ...w, active: false } : w));
  }

  focus(id: string): void {
    this.windowsSignal.update((list) =>
      list.map((w) =>
        w.id === id
          ? { ...w, active: true, zIndex: ++this.zCounter, minimized: false }
          : { ...w, active: false },
      ),
    );
  }

  close(id: string): void {
    this.windowsSignal.update((list) => {
      const remaining = list.filter((w) => w.id !== id);
      // Only a visible (non-minimized) window may become the new active one —
      // promoting a minimized window would leave it "active" while hidden,
      // which (among other things) made the Dock think a maximized window
      // was still on screen and kept it hidden after closing.
      const visibleRemaining = remaining.filter((w) => !w.minimized);
      if (visibleRemaining.length && !remaining.some((w) => w.active)) {
        const topMost = [...visibleRemaining].sort((a, b) => b.zIndex - a.zIndex)[0];
        return remaining.map((w) => (w.id === topMost.id ? { ...w, active: true } : w));
      }
      return remaining;
    });
    this.sound.close();
  }

  closeAppWindows(appId: string): void {
    this.windowsSignal.update((list) => list.filter((w) => w.appId !== appId));
    this.sound.close();
  }

  minimize(id: string): void {
    this.windowsSignal.update((list) =>
      list.map((w) => (w.id === id ? { ...w, minimized: true, active: false } : w)),
    );
    this.sound.minimize();
    const remaining = this.windowsSignal().filter((w) => !w.minimized);
    if (remaining.length) {
      const topMost = [...remaining].sort((a, b) => b.zIndex - a.zIndex)[0];
      this.focus(topMost.id);
    }
  }

  restore(id: string): void {
    this.windowsSignal.update((list) => list.map((w) => (w.id === id ? { ...w, minimized: false } : w)));
    this.focus(id);
    this.sound.restore();
  }

  toggleMinimize(id: string): void {
    const win = this.windowsSignal().find((w) => w.id === id);
    if (!win) return;
    if (win.minimized) this.restore(id);
    else this.minimize(id);
  }

  /** "Show Desktop": minimizes every open, non-minimized window — used by Mission Control / Control Center. */
  minimizeAll(): void {
    this.windowsSignal.update((list) => list.map((w) => ({ ...w, minimized: true, active: false })));
    this.sound.minimize();
  }

  toggleMaximize(id: string): void {
    const viewport = this.viewportSize();
    this.windowsSignal.update((list) =>
      list.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized && w.restoreRect) {
          // Clamp the remembered "restore" size to whatever room the current
          // viewport actually has — if the browser window (or device
          // orientation) got narrower since this window was maximized,
          // restoring shouldn't hand back a window that overflows again.
          const restored: Rect = {
            x: w.restoreRect.x,
            y: w.restoreRect.y,
            width: Math.min(w.restoreRect.width, Math.max(w.minSize.width, viewport.width - 16)),
            height: Math.min(w.restoreRect.height, Math.max(w.minSize.height, viewport.height - MENU_BAR_HEIGHT - 16)),
          };
          return { ...w, maximized: false, rect: restored, restoreRect: null };
        }
        // Edge-to-edge: a maximized window fills the entire screen below the menu
        // bar, with no side/bottom margins — the Dock is hidden while it's active
        // (see `isFullscreenActive`) so there's nothing left for it to overlap.
        const fullRect: Rect = {
          x: 0,
          y: MENU_BAR_HEIGHT,
          width: viewport.width,
          height: viewport.height - MENU_BAR_HEIGHT,
        };
        return { ...w, maximized: true, restoreRect: w.rect, rect: fullRect };
      }),
    );
    this.focus(id);
    this.sound.restore();
  }

  move(id: string, x: number, y: number): void {
    const viewport = this.viewportSize();
    this.windowsSignal.update((list) =>
      list.map((w) => {
        if (w.id !== id || w.maximized) return w;
        const clampedX = clamp(x, -(w.rect.width - 80), viewport.width - 80);
        const clampedY = clamp(y, MENU_BAR_HEIGHT, viewport.height - 40);
        return { ...w, rect: { ...w.rect, x: clampedX, y: clampedY } };
      }),
    );
  }

  resize(id: string, width: number, height: number, x?: number, y?: number): void {
    this.windowsSignal.update((list) =>
      list.map((w) => {
        if (w.id !== id || w.maximized) return w;
        const clampedWidth = Math.max(w.minSize.width, width);
        const clampedHeight = Math.max(w.minSize.height, height);
        return {
          ...w,
          rect: {
            x: x ?? w.rect.x,
            y: y ?? w.rect.y,
            width: clampedWidth,
            height: clampedHeight,
          },
        };
      }),
    );
  }

  setTitle(id: string, title: string): void {
    this.windowsSignal.update((list) => list.map((w) => (w.id === id ? { ...w, title } : w)));
  }

  updateData(id: string, data: Record<string, unknown>): void {
    this.windowsSignal.update((list) =>
      list.map((w) => (w.id === id ? { ...w, data: { ...w.data, ...data } } : w)),
    );
  }

  closeAll(): void {
    this.windowsSignal.set([]);
  }

  private viewportSize(): { width: number; height: number } {
    return { width: window.innerWidth, height: window.innerHeight };
  }
}
