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
});
