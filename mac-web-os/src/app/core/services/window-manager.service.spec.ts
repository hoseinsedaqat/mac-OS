import { TestBed } from '@angular/core/testing';
import { WindowManagerService } from './window-manager.service';

describe('WindowManagerService', () => {
  let wm: WindowManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    wm = TestBed.inject(WindowManagerService);
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  });

  it('opens a window for a registered app and marks it active', () => {
    const id = wm.open('notes');
    expect(id).toBeTruthy();
    const win = wm.windows().find((w) => w.id === id);
    expect(win).toBeTruthy();
    expect(win?.active).toBe(true);
    expect(win?.appId).toBe('notes');
  });

  it('returns null for an unknown app id instead of creating a broken window', () => {
    const id = wm.open('not-a-real-app');
    expect(id).toBeNull();
    expect(wm.windows().length).toBe(0);
  });

  it('focuses the existing window instead of opening a duplicate for single-instance apps', () => {
    const firstId = wm.open('notes');
    const secondId = wm.open('notes');
    expect(secondId).toBe(firstId);
    expect(wm.windowsForApp('notes').length).toBe(1);
  });

  it('allows multi-instance apps (e.g. Finder) to open several windows', () => {
    const a = wm.open('finder');
    const b = wm.open('finder');
    expect(a).not.toBe(b);
    expect(wm.windowsForApp('finder').length).toBe(2);
  });

  it('only keeps a single window active at a time when a new one opens', () => {
    const a = wm.open('finder');
    const b = wm.open('safari');
    const winA = wm.windows().find((w) => w.id === a);
    const winB = wm.windows().find((w) => w.id === b);
    expect(winA?.active).toBe(false);
    expect(winB?.active).toBe(true);
  });

  it('clamps the initial window rect so it never opens off-screen', () => {
    const id = wm.open('notes');
    const win = wm.windows().find((w) => w.id === id);
    expect(win!.rect.x).toBeGreaterThanOrEqual(0);
    expect(win!.rect.y).toBeGreaterThanOrEqual(0);
    expect(win!.rect.x + win!.rect.width).toBeLessThanOrEqual(window.innerWidth + 8);
  });

  it('minimizing a window deactivates it and focuses the next visible window', () => {
    const a = wm.open('finder')!;
    const b = wm.open('safari')!;
    wm.minimize(b);
    const winB = wm.windows().find((w) => w.id === b);
    const winA = wm.windows().find((w) => w.id === a);
    expect(winB?.minimized).toBe(true);
    expect(winB?.active).toBe(false);
    expect(winA?.active).toBe(true);
  });

  it('restoring a minimized window un-minimizes and focuses it', () => {
    const a = wm.open('notes')!;
    wm.minimize(a);
    wm.restore(a);
    const win = wm.windows().find((w) => w.id === a);
    expect(win?.minimized).toBe(false);
    expect(win?.active).toBe(true);
  });

  it('toggleMaximize stores the previous rect and restores it on toggle back', () => {
    const id = wm.open('notes')!;
    const before = wm.windows().find((w) => w.id === id)!.rect;
    wm.toggleMaximize(id);
    const maximized = wm.windows().find((w) => w.id === id)!;
    expect(maximized.maximized).toBe(true);
    expect(maximized.restoreRect).toEqual(before);

    wm.toggleMaximize(id);
    const restored = wm.windows().find((w) => w.id === id)!;
    expect(restored.maximized).toBe(false);
    expect(restored.rect).toEqual(before);
  });

  it('closing a window removes it and re-activates the topmost remaining window', () => {
    const a = wm.open('finder')!;
    const b = wm.open('safari')!;
    wm.close(b);
    expect(wm.windows().find((w) => w.id === b)).toBeUndefined();
    const winA = wm.windows().find((w) => w.id === a);
    expect(winA?.active).toBe(true);
  });

  it('closing the active window never promotes a minimized window to active (regression: Dock stayed hidden)', () => {
    // A was maximized, then minimized — it keeps its `maximized` flag while hidden,
    // exactly like a real minimized-after-maximize window would.
    const a = wm.open('finder')!;
    wm.toggleMaximize(a);
    wm.minimize(a);
    const b = wm.open('safari')!;
    wm.toggleMaximize(b);

    wm.close(b);

    const winA = wm.windows().find((w) => w.id === a)!;
    expect(winA.minimized).toBe(true);
    expect(winA.active).toBe(false);
    expect(wm.activeWindow()).toBeNull();
    expect(wm.isFullscreenActive()).toBe(false);
  });

  it('isFullscreenActive is only true while the frontmost visible window is maximized', () => {
    const id = wm.open('finder')!;
    expect(wm.isFullscreenActive()).toBe(false);
    wm.toggleMaximize(id);
    expect(wm.isFullscreenActive()).toBe(true);
    wm.minimize(id);
    expect(wm.isFullscreenActive()).toBe(false);
  });

  it('reopening a single-instance window with new data merges it without creating a second window', () => {
    const id = wm.open('trash')!;
    wm.open('trash', { data: { emptyRequested: 123 } });
    expect(wm.windowsForApp('trash').length).toBe(1);
    const win = wm.windows().find((w) => w.id === id);
    expect(win?.data['emptyRequested']).toBe(123);
  });

  it('resize respects the minimum size declared by the app', () => {
    const id = wm.open('calculator')!;
    const win = wm.windows().find((w) => w.id === id)!;
    wm.resize(id, 1, 1);
    const resized = wm.windows().find((w) => w.id === id)!;
    expect(resized.rect.width).toBe(win.minSize.width);
    expect(resized.rect.height).toBe(win.minSize.height);
  });

  describe('mobile/touch-sized viewports', () => {
    function setViewport(width: number, height: number): void {
      Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
    }

    it('opens a window fullscreen (filling below the menu bar) when the viewport is too small for its minimum size', () => {
      setViewport(375, 667); // iPhone-sized viewport
      const id = wm.open('notes')!;
      const win = wm.windows().find((w) => w.id === id)!;
      expect(win.maximized).toBe(true);
      expect(win.rect).toEqual({ x: 0, y: 32, width: 375, height: 635 });
      // The normal floating size is remembered so a later "un-maximize" has somewhere sensible to go back to.
      expect(win.restoreRect).not.toBeNull();
    });

    it('opens a normal floating window (not maximized) when the viewport comfortably fits it', () => {
      setViewport(1200, 800);
      const id = wm.open('notes')!;
      const win = wm.windows().find((w) => w.id === id)!;
      expect(win.maximized).toBe(false);
    });

    it('snaps an already-open window to fullscreen if the viewport shrinks below its minimum size', () => {
      setViewport(1200, 800);
      const id = wm.open('notes')!;
      expect(wm.windows().find((w) => w.id === id)!.maximized).toBe(false);

      setViewport(360, 640);
      window.dispatchEvent(new Event('resize'));

      const win = wm.windows().find((w) => w.id === id)!;
      expect(win.maximized).toBe(true);
      expect(win.rect).toEqual({ x: 0, y: 32, width: 360, height: 608 });
    });

    it('toggleMaximize clamps the restored size to the current viewport, so it never hands back an overflowing window', () => {
      setViewport(1200, 800);
      const id = wm.open('notes')!;
      const original = wm.windows().find((w) => w.id === id)!.rect;
      wm.toggleMaximize(id); // maximize

      // Simulate the browser window (or device orientation) having gotten much narrower while maximized.
      setViewport(500, 700);
      wm.toggleMaximize(id); // un-maximize/restore

      const restored = wm.windows().find((w) => w.id === id)!;
      expect(restored.maximized).toBe(false);
      expect(restored.rect.width).toBeLessThanOrEqual(500);
      expect(restored.rect.height).toBeLessThanOrEqual(700 - 32);
      // Still at least as big as the app declares it needs to be.
      expect(restored.rect.width).toBeGreaterThanOrEqual(restored.minSize.width);
      // And smaller than (or equal to) what it would have restored to with plenty of room.
      expect(restored.rect.width).toBeLessThanOrEqual(original.width);
    });
  });
});
