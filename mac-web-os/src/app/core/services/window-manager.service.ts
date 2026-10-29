import { Injectable, computed, signal } from '@angular/core';
import { OpenWindowOptions, Rect, WindowState } from '../models/window.model';
import { ApplicationRegistryService } from './application-registry.service';
import { createId } from '../../shared/utils/id.util';
import { clamp } from '../../shared/utils/clamp.util';

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

  constructor(private readonly registry: ApplicationRegistryService) {}

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

    const win: WindowState = {
      id: createId('win'),
      appId,
      title: options.title ?? def.name,
      rect,
      restoreRect: null,
      minSize: { width: def.window.minWidth, height: def.window.minHeight },
      resizable: def.window.resizable,
      minimized: false,
      maximized: false,
      active: true,
      zIndex: ++this.zCounter,
      data: options.data ?? {},
      icon: def.icon,
      createdAt: Date.now(),
    };

    this.windowsSignal.update((list) => [...this.deactivateAll(list), win]);
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
      if (remaining.length && !remaining.some((w) => w.active)) {
        const topMost = [...remaining].sort((a, b) => b.zIndex - a.zIndex)[0];
        return remaining.map((w) => (w.id === topMost.id ? { ...w, active: true } : w));
      }
      return remaining;
    });
  }

  closeAppWindows(appId: string): void {
    this.windowsSignal.update((list) => list.filter((w) => w.appId !== appId));
  }

  minimize(id: string): void {
    this.windowsSignal.update((list) =>
      list.map((w) => (w.id === id ? { ...w, minimized: true, active: false } : w)),
    );
    const remaining = this.windowsSignal().filter((w) => !w.minimized);
    if (remaining.length) {
      const topMost = [...remaining].sort((a, b) => b.zIndex - a.zIndex)[0];
      this.focus(topMost.id);
    }
  }

  restore(id: string): void {
    this.windowsSignal.update((list) => list.map((w) => (w.id === id ? { ...w, minimized: false } : w)));
    this.focus(id);
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
  }

  toggleMaximize(id: string): void {
    const viewport = this.viewportSize();
    this.windowsSignal.update((list) =>
      list.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized && w.restoreRect) {
          return { ...w, maximized: false, rect: w.restoreRect, restoreRect: null };
        }
        const fullRect: Rect = {
          x: 6,
          y: MENU_BAR_HEIGHT + 6,
          width: viewport.width - 12,
          height: viewport.height - MENU_BAR_HEIGHT - 12,
        };
        return { ...w, maximized: true, restoreRect: w.rect, rect: fullRect };
      }),
    );
    this.focus(id);
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
