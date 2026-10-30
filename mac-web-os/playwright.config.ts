import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for MacWeb OS end-to-end tests.
 *
 * These tests drive a real browser through the actual boot → lock screen →
 * login → desktop flow (exactly like a real user), then exercise window
 * management (open/maximize/minimize/close) against the live Angular dev
 * server. They exist to catch UI-interaction regressions — like the Dock
 * staying hidden after closing a maximized window — that unit tests alone
 * cannot see, because they never render the real DOM or run real pointer
 * interactions.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx ng serve --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
