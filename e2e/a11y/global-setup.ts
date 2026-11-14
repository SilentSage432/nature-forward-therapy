import type { FullConfig } from "@playwright/test";

/**
 * Deterministic public-route warmup before the a11y suite.
 * Ensures `/`, `/articles`, and `/bookshelf` respond OK under the same baseURL
 * the tests will use (Playwright webServer or A11Y_BASE_URL).
 */
async function waitForOk(url: string, attempts = 60): Promise<void> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.ok) return;
      lastError = new Error(`${url} -> ${res.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(
    `A11y global setup: route not ready: ${url} (${String(lastError)})`,
  );
}

export default async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects[0]?.use?.baseURL ||
    process.env.A11Y_BASE_URL ||
    process.env.PLAYWRIGHT_BASE_URL ||
    "http://127.0.0.1:3042";

  for (const route of ["/", "/articles", "/bookshelf"] as const) {
    await waitForOk(new URL(route, baseURL).toString());
  }
}
