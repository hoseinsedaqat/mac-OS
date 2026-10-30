import { expect, test } from '@playwright/test';
import {
  bootToDesktop,
  openFromDock,
  maximizeActiveWindow,
  minimizeActiveWindow,
  closeActiveWindow,
} from './helpers';

test.describe('Boot and desktop', () => {
  test('boots through the splash/lock/login flow onto the desktop', async ({ page }) => {
    await bootToDesktop(page);

    await expect(page.locator('.mw-menubar')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Dock' })).toBeVisible();
  });
});

test.describe('Opening and maximizing windows', () => {
  test('opening an app from the Dock shows its window', async ({ page }) => {
    await bootToDesktop(page);
    await openFromDock(page, 'Finder');

    await expect(page.locator('.mw-window.active')).toBeVisible();
    await expect(page.locator('.mw-window.active .mw-window__title')).toHaveText('Finder');
  });

  test('maximizing a window fills the screen edge-to-edge and hides the Dock', async ({ page }) => {
    await bootToDesktop(page);
    await openFromDock(page, 'Finder');

    await maximizeActiveWindow(page);

    // Hidden Dock: real macOS also hides the Dock behind a fullscreen app.
    await expect(page.getByRole('navigation', { name: 'Dock' })).toHaveCount(0);

    const box = await page.locator('.mw-window.active').boundingBox();
    const viewport = page.viewportSize()!;
    expect(box).not.toBeNull();
    expect(box!.x).toBe(0);
    expect(box!.width).toBe(viewport.width);
    // The window starts right below the menu bar and reaches the bottom edge.
    expect(box!.y + box!.height).toBe(viewport.height);
  });
});

test.describe('Closing windows and the Dock (regression)', () => {
  test('closing a maximized window brings the Dock back', async ({ page }) => {
    await bootToDesktop(page);
    await openFromDock(page, 'Finder');
    await maximizeActiveWindow(page);
    await expect(page.getByRole('navigation', { name: 'Dock' })).toHaveCount(0);

    await closeActiveWindow(page);

    await expect(page.getByRole('navigation', { name: 'Dock' })).toBeVisible();
    await expect(page.locator('.mw-window')).toHaveCount(0);
  });

  test('closing a maximized window still shows the Dock even with another window minimized in the background', async ({
    page,
  }) => {
    // Regression test for: a window that was maximized and then minimized
    // keeps its "maximized" flag while hidden. Closing a different maximized
    // window used to wrongly promote that hidden window to "active", which
    // made the Dock think a fullscreen app was still on screen and kept it
    // hidden even though nothing was visible.
    await bootToDesktop(page);

    await openFromDock(page, 'Finder');
    await maximizeActiveWindow(page);
    await minimizeActiveWindow(page);

    await openFromDock(page, 'Safari');
    await maximizeActiveWindow(page);
    await expect(page.getByRole('navigation', { name: 'Dock' })).toHaveCount(0);

    await closeActiveWindow(page);

    await expect(page.getByRole('navigation', { name: 'Dock' })).toBeVisible();
    // Finder is still minimized in the background, not actually on screen.
    await expect(page.locator('.mw-window[aria-hidden="true"]')).toHaveCount(1);
    await expect(page.locator('.mw-window:not([aria-hidden="true"])')).toHaveCount(0);
  });
});
