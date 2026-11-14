import type { Page, TestInfo } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export type NavDiagnostics = {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: Array<{ url: string; failure?: string; method: string }>;
  responses: Array<{ url: string; status: number }>;
};

/** Attach listeners for a single navigation window. Call stop() when done. */
export function attachNavDiagnostics(page: Page): NavDiagnostics & {
  stop: () => void;
} {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: Array<{
    url: string;
    failure?: string;
    method: string;
  }> = [];
  const responses: Array<{ url: string; status: number }> = [];

  const onConsole = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  };
  const onPageError = (err: Error) => pageErrors.push(String(err));
  const onRequestFailed = (req: {
    url: () => string;
    failure: () => { errorText: string } | null;
    method: () => string;
  }) => {
    failedRequests.push({
      url: req.url().slice(0, 240),
      failure: req.failure()?.errorText,
      method: req.method(),
    });
  };
  const onResponse = (res: { url: () => string; status: () => number }) => {
    const url = res.url();
    if (
      url.includes("/articles") ||
      url.includes("/_next/") ||
      url.includes("?_rsc=")
    ) {
      responses.push({ url: url.slice(0, 240), status: res.status() });
    }
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);
  page.on("response", onResponse);

  return {
    consoleErrors,
    pageErrors,
    failedRequests,
    responses,
    stop() {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
      page.off("requestfailed", onRequestFailed);
      page.off("response", onResponse);
    },
  };
}

export async function persistNavFailure(
  testInfo: TestInfo,
  meta: {
    path: string;
    status: number | null;
    title: string;
    bodySnippet: string;
    diagnostics: NavDiagnostics;
  },
) {
  const dir = path.resolve("tmp/a11y/stab01");
  mkdirSync(dir, { recursive: true });
  const file = path.join(
    dir,
    `nav-fail-${testInfo.project.name}-${Date.now()}.json`,
  );
  const payload = {
    test: testInfo.title,
    ...meta,
    timestamp: new Date().toISOString(),
  };
  writeFileSync(file, JSON.stringify(payload, null, 2));
  await testInfo.attach("nav-failure-diagnostics", {
    body: Buffer.from(JSON.stringify(payload, null, 2)),
    contentType: "application/json",
  });
  return file;
}
