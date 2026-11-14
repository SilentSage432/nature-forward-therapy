import type { Locator, Page } from "@playwright/test";
import {
  PUBLIC_MAIN_CONTENT_ID,
  PUBLIC_SKIP_LABEL,
} from "../../../lib/site-design/public-keyboard";

export async function focusSkipLink(page: Page): Promise<Locator> {
  const skip = page.locator("[data-public-skip-to-content]");
  await skip.waitFor({ state: "attached", timeout: 10_000 });
  await skip.focus();
  return skip;
}

export async function assertSkipLinkVisibleOnFocus(page: Page) {
  const skip = await focusSkipLink(page);
  const box = await skip.boundingBox();
  const styles = await skip.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      clipPath: cs.clipPath,
      width: cs.width,
      height: cs.height,
      opacity: cs.opacity,
      text: (el as HTMLElement).innerText.trim(),
    };
  });

  if (!box || box.width < 8 || box.height < 8) {
    throw new Error(
      `Skip link not visibly revealed on focus (box=${JSON.stringify(box)} styles=${JSON.stringify(styles)})`,
    );
  }
  if (styles.text !== PUBLIC_SKIP_LABEL) {
    throw new Error(`Unexpected skip label: ${styles.text}`);
  }
  return { skip, box, styles };
}

export async function activateSkipAndLandOnMain(page: Page) {
  await focusSkipLink(page);
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    (id) => document.activeElement?.id === id,
    PUBLIC_MAIN_CONTENT_ID,
    { timeout: 5000 },
  );
  const activeId = await page.evaluate(() => document.activeElement?.id ?? null);
  if (activeId !== PUBLIC_MAIN_CONTENT_ID) {
    throw new Error(`Expected focus on #${PUBLIC_MAIN_CONTENT_ID}, got ${activeId}`);
  }
}

export type FocusStyleSnapshot = {
  outlineStyle: string;
  outlineWidth: string;
  outlineColor: string;
  boxShadow: string;
  tag: string;
  text: string;
};

export async function snapshotFocusedStyles(page: Page): Promise<FocusStyleSnapshot> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) {
      return {
        outlineStyle: "none",
        outlineWidth: "0px",
        outlineColor: "transparent",
        boxShadow: "none",
        tag: "BODY",
        text: "",
      };
    }
    const cs = getComputedStyle(el);
    return {
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      boxShadow: cs.boxShadow,
      tag: el.tagName,
      text: (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 80),
    };
  });
}

export function hasVisibleFocusIndicator(styles: FocusStyleSnapshot): boolean {
  const outlineOk =
    styles.outlineStyle !== "none" &&
    Number.parseFloat(styles.outlineWidth) > 0;
  const shadowOk = styles.boxShadow !== "none" && styles.boxShadow !== "";
  return outlineOk || shadowOk;
}

export async function openMobileMenuWithKeyboard(page: Page) {
  const toggle = page.locator(
    'button[aria-controls="mobile-nav-menu"]',
  );
  await toggle.focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => {
    const btn = document.querySelector(
      'button[aria-controls="mobile-nav-menu"]',
    );
    return btn?.getAttribute("aria-expanded") === "true";
  });
  return toggle;
}

export async function closeMobileMenuWithEscape(page: Page) {
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => {
    const btn = document.querySelector(
      'button[aria-controls="mobile-nav-menu"]',
    );
    return btn?.getAttribute("aria-expanded") === "false";
  });
}

/**
 * Crude keyboard-trap probe: Tab a bounded number of times and ensure focus
 * continues to move among focusable elements (not stuck on one node forever).
 */
export async function assertNoObviousKeyboardTrap(
  page: Page,
  tabs = 16,
): Promise<{ uniqueFocusKeys: number; sequence: string[] }> {
  const sequence: string[] = [];
  for (let i = 0; i < tabs; i += 1) {
    await page.keyboard.press("Tab");
    const key = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return "BODY";
      const label =
        el.getAttribute("aria-label") ||
        el.getAttribute("href") ||
        el.id ||
        el.tagName;
      return `${el.tagName}:${label}`.slice(0, 120);
    });
    sequence.push(key);
  }
  const unique = new Set(sequence);
  if (unique.size < 2) {
    throw new Error(
      `Possible keyboard trap — focus stayed on one target across ${tabs} Tabs: ${sequence[0]}`,
    );
  }
  return { uniqueFocusKeys: unique.size, sequence };
}
