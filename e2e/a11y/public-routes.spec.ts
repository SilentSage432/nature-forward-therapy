import { expect, test } from "@playwright/test";
import {
  formatAxeFailure,
  persistAxeSummary,
  runAxeOnPage,
} from "./helpers/axe";
import { gotoPublic } from "./helpers/goto";
import { inspectLandmarksAndNames } from "./helpers/landmarks";
import { PUBLIC_A11Y_ROUTES, VIEWPORTS } from "./helpers/routes";

test.describe("Public route accessibility (axe + landmarks)", () => {
  test.describe.configure({ mode: "serial" });

  for (const route of PUBLIC_A11Y_ROUTES) {
    test(`${route.name} — landmarks, names, axe @ desktop`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await gotoPublic(page, route.path);
      await expect(page.locator("[data-site-theme]")).toBeAttached();
      await expect(page.locator("#main-content")).toBeAttached();

      const landmarks = await inspectLandmarksAndNames(page);
      expect(landmarks.mains, "exactly one main landmark").toBe(1);
      expect(landmarks.mainIds[0]).toBe("main-content");
      expect(landmarks.navs, "nav landmark present").toBeGreaterThanOrEqual(1);
      expect(landmarks.h1Count, "single h1").toBe(1);
      expect(
        landmarks.headingHierarchyIssues,
        landmarks.headingHierarchyIssues.join("; "),
      ).toEqual([]);
      expect(
        landmarks.imagesMissingAlt,
        `images missing alt: ${JSON.stringify(landmarks.imagesMissingAlt)}`,
      ).toEqual([]);
      expect(
        landmarks.unlabeledControls,
        `unlabeled controls: ${JSON.stringify(landmarks.unlabeledControls)}`,
      ).toEqual([]);

      const axe = await runAxeOnPage(page, {
        route: route.path,
        viewport: VIEWPORTS.desktop.label,
      });
      persistAxeSummary(axe, `${route.name}-desktop`);
      await testInfo.attach(`axe-${route.name}-desktop`, {
        body: Buffer.from(JSON.stringify(axe, null, 2)),
        contentType: "application/json",
      });

      // Enforced public route lane (published/default design as served).
      expect(axe.violations, formatAxeFailure(axe)).toEqual([]);

      if (axe.incomplete.length > 0) {
        testInfo.annotations.push({
          type: "manual-review",
          description: `${route.path}: axe incomplete rules [${axe.incomplete.map((i) => i.id).join(", ")}] — not a pass certificate; operator review required.`,
        });
      }
    });
  }

  test("article detail — only when a published fixture link exists", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto("/articles", { waitUntil: "domcontentloaded" });

    const href = await page.evaluate(() => {
      const link = document.querySelector<HTMLAnchorElement>(
        'main a[href^="/articles/"]',
      );
      return link?.getAttribute("href") ?? null;
    });

    if (!href || href === "/articles") {
      testInfo.annotations.push({
        type: "deferred",
        description:
          "No deterministic published article detail fixture discovered on /articles. Coverage skipped without inventing content.",
      });
      test.skip(
        true,
        "Article detail deferred — no published fixture link available.",
      );
      return;
    }

    const response = await page.goto(href, { waitUntil: "domcontentloaded" });
    expect(response?.ok() ?? false).toBeTruthy();
    await expect(page.locator("#main-content")).toBeAttached();

    const landmarks = await inspectLandmarksAndNames(page);
    expect(landmarks.mains).toBe(1);
    expect(landmarks.h1Count).toBe(1);

    const axe = await runAxeOnPage(page, {
      route: href,
      viewport: VIEWPORTS.desktop.label,
    });
    persistAxeSummary(axe, "article-detail-desktop");
    expect(axe.violations, formatAxeFailure(axe)).toEqual([]);
    if (axe.incomplete.length > 0) {
      testInfo.annotations.push({
        type: "manual-review",
        description: `${href}: axe incomplete rules [${axe.incomplete.map((i) => i.id).join(", ")}]`,
      });
    }
  });
});

