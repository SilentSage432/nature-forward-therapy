import type { Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export type ReflowProbe = {
  kind: "viewport-simulation" | "css-text-resize" | "css-zoom-approx";
  label: string;
  note: string;
  viewport: { width: number; height: number };
  scrollWidth: number;
  clientWidth: number;
  horizontalOverflow: boolean;
  headingWrapOk: boolean;
  paragraphWrapOk: boolean;
  clippedControls: Array<{ name: string; reason: string }>;
  stickyFocusObscured: boolean | null;
  stickyFocusNote: string;
};

async function measureOverflowAndWrap(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const scrollWidth = doc.scrollWidth;
    const clientWidth = doc.clientWidth;
    const horizontalOverflow = scrollWidth > clientWidth + 1;

    const headings = Array.from(document.querySelectorAll("h1, h2, h3"));
    const paragraphs = Array.from(document.querySelectorAll("main p")).slice(0, 8);

    const headingWrapOk = headings.every((el) => {
      const cs = getComputedStyle(el);
      return cs.overflowX !== "scroll" && el.scrollWidth <= el.clientWidth + 2;
    });
    const paragraphWrapOk = paragraphs.every((el) => {
      return el.scrollWidth <= el.clientWidth + 2;
    });

    const interactive = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a, button, summary, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).slice(0, 40);

    const clippedControls: Array<{ name: string; reason: string }> = [];
    for (const el of interactive) {
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      // Skip clipped skip-link at rest and zero-box nodes.
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      // Only flag controls that participate in the layout viewport strip
      // (ignore off-screen absolute/clipped affordances).
      if (rect.right > window.innerWidth + 1 || rect.left < -1) {
        const name =
          el.getAttribute("aria-label") ||
          el.getAttribute("href") ||
          el.id ||
          el.tagName;
        clippedControls.push({
          name: String(name).slice(0, 80),
          reason: `outside viewport x=${Math.round(rect.left)}..${Math.round(rect.right)} vw=${window.innerWidth}`,
        });
      }
    }

    return {
      scrollWidth,
      clientWidth,
      horizontalOverflow,
      headingWrapOk,
      paragraphWrapOk,
      clippedControls: clippedControls.slice(0, 8),
    };
  });
}

async function probeStickyFocusObscured(page: Page): Promise<{
  obscured: boolean | null;
  note: string;
}> {
  return page.evaluate(() => {
    const mainLink = document.querySelector<HTMLElement>(
      "main a, main button",
    );
    if (!mainLink) {
      return { obscured: null, note: "No main interactive control to probe." };
    }
    mainLink.focus();
    const focusRect = mainLink.getBoundingClientRect();
    const header = document.querySelector("header");
    if (!header) {
      return { obscured: false, note: "No sticky header present." };
    }
    const headerRect = header.getBoundingClientRect();
    const headerCs = getComputedStyle(header);
    const sticky =
      headerCs.position === "fixed" || headerCs.position === "sticky";
    if (!sticky) {
      return { obscured: false, note: "Header is not sticky/fixed." };
    }
    const overlaps =
      focusRect.top < headerRect.bottom &&
      focusRect.bottom > headerRect.top &&
      focusRect.left < headerRect.right &&
      focusRect.right > headerRect.left;
    return {
      obscured: overlaps,
      note: overlaps
        ? "Focused main control intersects sticky header bounding box (possible obscuring)."
        : "Focused main control does not intersect sticky header box at rest.",
    };
  });
}

export async function probeViewportReflow(
  page: Page,
  viewport: { width: number; height: number },
  label: string,
): Promise<ReflowProbe> {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(150);
  const metrics = await measureOverflowAndWrap(page);
  const sticky = await probeStickyFocusObscured(page);
  return {
    kind: "viewport-simulation",
    label,
    note:
      "Playwright viewport resize only — not equivalent to browser zoom or OS display scaling.",
    viewport,
    ...metrics,
    stickyFocusObscured: sticky.obscured,
    stickyFocusNote: sticky.note,
  };
}

/**
 * Approximate 200% text resize by scaling the root font-size.
 * This is NOT browser zoom; layout chrome in px may not scale.
 */
export async function probeCssTextResize200(
  page: Page,
  viewport: { width: number; height: number },
): Promise<ReflowProbe> {
  await page.setViewportSize(viewport);
  await page.evaluate(() => {
    const root = document.documentElement;
    const current = Number.parseFloat(getComputedStyle(root).fontSize) || 16;
    root.style.fontSize = `${current * 2}px`;
    root.dataset.a11yTextResize = "200";
  });
  await page.waitForTimeout(150);
  const metrics = await measureOverflowAndWrap(page);
  const sticky = await probeStickyFocusObscured(page);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
    delete document.documentElement.dataset.a11yTextResize;
  });
  return {
    kind: "css-text-resize",
    label: "text-resize-200pct-css",
    note:
      "Root font-size ×2 simulation. Distinguishes text scaling from viewport narrowing; not browser zoom.",
    viewport,
    ...metrics,
    stickyFocusObscured: sticky.obscured,
    stickyFocusNote: sticky.note,
  };
}

/**
 * Approximate 400% zoom reflow using a 320×256 CSS viewport at 1280 reference.
 * Explicitly NOT actual browser zoom (Page.zoom / pinch-zoom).
 */
export async function probeZoomEquivalentReflow(
  page: Page,
): Promise<ReflowProbe> {
  const viewport = { width: 320, height: 256 };
  await page.setViewportSize(viewport);
  await page.waitForTimeout(150);
  const metrics = await measureOverflowAndWrap(page);
  const sticky = await probeStickyFocusObscured(page);
  return {
    kind: "viewport-simulation",
    label: "reflow-approx-400pct-320css",
    note:
      "WCAG 1.4.10-style narrow CSS viewport (1280/4 ≈ 320). Not actual browser zoom; do not claim reflow conformance from this alone.",
    viewport,
    ...metrics,
    stickyFocusObscured: sticky.obscured,
    stickyFocusNote: sticky.note,
  };
}

/**
 * Limited CDP page-scale probe when available — still report as approximation.
 */
export async function probeCssZoomApprox(
  page: Page,
  viewport: { width: number; height: number },
): Promise<ReflowProbe> {
  await page.setViewportSize(viewport);
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
    document.documentElement.dataset.a11yCssZoom = "2";
  });
  await page.waitForTimeout(150);
  const metrics = await measureOverflowAndWrap(page);
  const sticky = await probeStickyFocusObscured(page);
  await page.evaluate(() => {
    document.documentElement.style.zoom = "";
    delete document.documentElement.dataset.a11yCssZoom;
  });
  return {
    kind: "css-zoom-approx",
    label: "css-zoom-2x-approx",
    note:
      "documentElement.style.zoom = 2 approximation. Not identical to browser chrome zoom UI.",
    viewport,
    ...metrics,
    stickyFocusObscured: sticky.obscured,
    stickyFocusNote: sticky.note,
  };
}

export function persistReflowProbes(probes: ReflowProbe[], fileStem: string) {
  const dir = path.resolve("tmp/a11y/reflow");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${fileStem}.json`);
  writeFileSync(file, JSON.stringify(probes, null, 2));
  return file;
}
