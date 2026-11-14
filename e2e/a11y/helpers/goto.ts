import type { Page, Response } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { attachNavDiagnostics, type NavDiagnostics } from "./diagnostics";

async function pageShellState(page: Page) {
  return page.evaluate(() => {
    const theme = document.querySelector("[data-site-theme]");
    const recovery = Boolean(
      document.body?.innerText?.match(/couldn[’']t load/i),
    );
    return {
      hasTheme: Boolean(theme),
      recovery,
      title: document.title,
      bodySnippet: (document.body?.innerText || "").slice(0, 240),
    };
  });
}

function persistGotoFailure(meta: {
  path: string;
  status: number | null;
  title: string;
  bodySnippet: string;
  diagnostics: NavDiagnostics;
  error: string;
}) {
  const dir = path.resolve("tmp/a11y/stab01");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `goto-fail-${Date.now()}.json`);
  writeFileSync(file, JSON.stringify({ ...meta, timestamp: new Date().toISOString() }, null, 2));
  return file;
}

/**
 * Navigate to a public route and require the SiteTheme shell.
 *
 * Success criterion: `[data-site-theme]` attached (deterministic readiness).
 * If Next.js shows its client recovery shell after a document navigation,
 * perform exactly one fresh document navigation (not a soft reload) and
 * persist diagnostics. Does not skip routes or weaken a11y assertions.
 */
export async function gotoPublic(
  page: Page,
  pathName: string,
  waitUntil: "load" | "domcontentloaded" = "domcontentloaded",
): Promise<Response | null> {
  const diagnostics = attachNavDiagnostics(page);
  let response: Response | null = null;

  try {
    response = await page.goto(pathName, { waitUntil });
    let state = await pageShellState(page);

    if (!state.hasTheme) {
      try {
        await page
          .locator("[data-site-theme]")
          .waitFor({ state: "attached", timeout: 5_000 });
        state = await pageShellState(page);
      } catch {
        state = await pageShellState(page);
      }
    }

    if (!state.hasTheme && state.recovery) {
      response = await page.goto(pathName, { waitUntil: "load" });
      await page
        .locator("[data-site-theme]")
        .waitFor({ state: "attached", timeout: 15_000 });
      return response;
    }

    if (!state.hasTheme) {
      await page
        .locator("[data-site-theme]")
        .waitFor({ state: "attached", timeout: 15_000 });
    }

    return response;
  } catch (error) {
    const state = await pageShellState(page).catch(() => ({
      hasTheme: false,
      recovery: false,
      title: "",
      bodySnippet: "",
    }));
    persistGotoFailure({
      path: pathName,
      status: response?.status() ?? null,
      title: state.title,
      bodySnippet: state.bodySnippet,
      diagnostics: {
        consoleErrors: diagnostics.consoleErrors,
        pageErrors: diagnostics.pageErrors,
        failedRequests: diagnostics.failedRequests,
        responses: diagnostics.responses,
      },
      error: String(error),
    });
    throw error;
  } finally {
    diagnostics.stop();
  }
}
