import type { Page } from "@playwright/test";
import { PUBLIC_MAIN_CONTENT_ID } from "../../../lib/site-design/public-keyboard";

export type LandmarkReport = {
  mains: number;
  mainIds: string[];
  navs: number;
  headers: number;
  footers: number;
  h1Count: number;
  headingLevels: number[];
  headingHierarchyIssues: string[];
  imagesMissingAlt: Array<{ src: string }>;
  unlabeledControls: Array<{ tag: string; detail: string }>;
  expectedMainId: string;
};

export async function inspectLandmarksAndNames(
  page: Page,
): Promise<LandmarkReport> {
  return page.evaluate((mainId) => {
    const mains = Array.from(document.querySelectorAll("main"));
    const navs = document.querySelectorAll("nav").length;
    const headers = document.querySelectorAll("header").length;
    const footers = document.querySelectorAll("footer").length;
    const headings = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
    );
    const headingLevels = headings.map((h) => Number(h.tagName.slice(1)));
    const h1Count = headingLevels.filter((l) => l === 1).length;

    const headingHierarchyIssues: string[] = [];
    if (h1Count === 0) headingHierarchyIssues.push("No h1 found.");
    if (h1Count > 1) headingHierarchyIssues.push(`Multiple h1 elements (${h1Count}).`);
    let prev = 0;
    for (const level of headingLevels) {
      if (prev > 0 && level > prev + 1) {
        headingHierarchyIssues.push(
          `Heading level jumps from h${prev} to h${level}.`,
        );
      }
      prev = level;
    }

    const imagesMissingAlt = Array.from(document.images)
      .filter((img) => !img.hasAttribute("alt"))
      .map((img) => ({ src: (img.currentSrc || img.src || "").slice(0, 120) }));

    const unlabeledControls: Array<{ tag: string; detail: string }> = [];
    const controls = Array.from(
      document.querySelectorAll<HTMLElement>("button, a, input, select, textarea"),
    );
    for (const el of controls) {
      const tag = el.tagName.toLowerCase();
      if (tag === "a") {
        const text = (el.textContent || "").trim();
        const aria = el.getAttribute("aria-label");
        const labelledBy = el.getAttribute("aria-labelledby");
        if (!text && !aria && !labelledBy) {
          unlabeledControls.push({
            tag,
            detail: el.getAttribute("href") || "(no accessible name)",
          });
        }
        continue;
      }
      if (tag === "button") {
        const text = (el.textContent || "").trim();
        const aria = el.getAttribute("aria-label");
        if (!text && !aria) {
          unlabeledControls.push({ tag, detail: "button without accessible name" });
        }
        continue;
      }
      const id = el.id;
      const aria = el.getAttribute("aria-label");
      const labelledBy = el.getAttribute("aria-labelledby");
      const hasLabel = id
        ? Boolean(document.querySelector(`label[for="${CSS.escape(id)}"]`))
        : Boolean(el.closest("label"));
      if (!aria && !labelledBy && !hasLabel) {
        unlabeledControls.push({
          tag,
          detail: `${el.getAttribute("name") || el.getAttribute("type") || id || "control"} missing label`,
        });
      }
    }

    return {
      mains: mains.length,
      mainIds: mains.map((m) => m.id || "(no-id)"),
      navs,
      headers,
      footers,
      h1Count,
      headingLevels,
      headingHierarchyIssues,
      imagesMissingAlt,
      unlabeledControls: unlabeledControls.slice(0, 12),
      expectedMainId: mainId,
    };
  }, PUBLIC_MAIN_CONTENT_ID) as Promise<LandmarkReport>;
}
