import { Page } from '@playwright/test';

/**
 * Drives a fresh page through the real boot splash → boot sequence → lock
 * screen → login flow, exactly like a real user, and leaves it sitting on
 * the desktop (menu bar + Dock visible, no windows open).
 */
export async function bootToDesktop(page: Page): Promise<void> {
  await page.goto('/');

  // Splash + boot progress bars run on their own timers and finish on their
  // own; just wait for the lock screen's "Press Enter to log in" to appear.
  await page.getByText(/press enter to log in/i).waitFor({ timeout: 20_000 });

  // Lock screen: a single click anywhere advances to the login screen.
  await page.mouse.click(400, 300);

  // Login screen (the demo "Guest User" account has no password): Enter logs in.
  await page.keyboard.press('Enter');

  // Desktop is up once the menu bar (and Dock) render.
  await page.locator('.mw-menubar').waitFor({ timeout: 10_000 });
  await page.getByRole('navigation', { name: 'Dock' }).waitFor({ timeout: 10_000 });

  // Dismiss the "Welcome to MacWeb OS" toast if it showed up, so it doesn't
  // overlap anything later screenshots/assertions care about.
  const dismiss = page.locator('[class*="notification"] button, [class*="toast"] button').first();
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click();
  }
}

/** Opens an app by clicking its Dock icon (by its accessible name). */
export async function openFromDock(page: Page, appName: string): Promise<void> {
  await page.getByRole('button', { name: appName, exact: true }).click();
  await page.locator('.mw-window.active').waitFor({ timeout: 10_000 });
}

/** Clicks the green "maximize" traffic-light button on the active window. */
export async function maximizeActiveWindow(page: Page): Promise<void> {
  await page.locator('.mw-window.active .mw-traffic--maximize').click();
  await page.locator('.mw-window.active.maximized').waitFor({ timeout: 5_000 });
}

/** Clicks the yellow "minimize" traffic-light button on the active window. */
export async function minimizeActiveWindow(page: Page): Promise<void> {
  await page.locator('.mw-window.active .mw-traffic--minimize').click();
}

/** Clicks the red "close" traffic-light button on the active window. */
export async function closeActiveWindow(page: Page): Promise<void> {
  await page.locator('.mw-window.active .mw-traffic--close').click();
}
