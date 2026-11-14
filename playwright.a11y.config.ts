import { defineConfig, devices } from "@playwright/test";

/**
 * NFT-STUDIO-007C-ENG03 — rendered accessibility harness (public routes only).
 *
 * Complements deterministic Studio a11y evaluation. Does not authenticate,
 * write SiteDesign, or claim WCAG conformance.
 *
 * Base URL:
 * - A11Y_BASE_URL / PLAYWRIGHT_BASE_URL when a server is already running
 * - otherwise webServer starts `next start` on A11Y_PORT (default 3042)
 *
 * STAB01: webServer readiness probes `/articles` (historically flaky under
 * premature suite start). Stale-server reuse is opt-in via A11Y_REUSE_SERVER=1.
 * global-setup warms `/`, `/articles`, `/bookshelf`.
 *
 * Enforcement (FIX01): published/default public routes enforce axe + landmarks +
 * keyboard. Alternate palette samples are advisory (recorded; zero gaps valid).
 * Passing is not a WCAG certificate.
 *
 * Prefer a local loopback DATABASE_URL via `.env.local`. Public GETs only.
 */

const port = process.env.A11Y_PORT || "3042";
const baseURL =
  process.env.A11Y_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  `http://127.0.0.1:${port}`;

const hasExternalBase = Boolean(
  process.env.A11Y_BASE_URL || process.env.PLAYWRIGHT_BASE_URL,
);

/** Opt-in only — default false avoids attaching to leftover half-dead servers. */
const reuseExistingServer = process.env.A11Y_REUSE_SERVER === "1";

export default defineConfig({
  testDir: "./e2e/a11y",
  testMatch: "**/*.spec.ts",
  globalSetup: "./e2e/a11y/global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["json", { outputFile: "tmp/a11y/playwright-report.json" }],
    ["html", { open: "never", outputFolder: "tmp/a11y/html-report" }],
  ],
  outputDir: "tmp/a11y/test-results",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: "chromium-a11y",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: hasExternalBase
    ? undefined
    : {
        command: `npx next start --hostname 127.0.0.1 --port ${port}`,
        // Ready only when the historically sensitive public route responds.
        url: `${baseURL.replace(/\/$/, "")}/articles`,
        reuseExistingServer,
        timeout: 120_000,
      },
});
