import { expect, test } from "@playwright/test";
import { gotoPublic } from "./helpers/goto";
import {
  activateSkipAndLandOnMain,
  assertNoObviousKeyboardTrap,
  assertSkipLinkVisibleOnFocus,
  closeMobileMenuWithEscape,
  hasVisibleFocusIndicator,
  openMobileMenuWithKeyboard,
  snapshotFocusedStyles,
} from "./helpers/keyboard";
import { VIEWPORTS } from "./helpers/routes";

test.describe("Public keyboard interaction", () => {
  test("skip link reveals, activates, and lands on main content", async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoPublic(page, "/");
    await assertSkipLinkVisibleOnFocus(page);
    await activateSkipAndLandOnMain(page);
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("navigation links expose visible :focus-visible indicators", async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoPublic(page, "/");

    // Tab until a primary desktop nav destination is focused (banner optional).
    let landed = false;
    for (let i = 0; i < 16; i += 1) {
      await page.keyboard.press("Tab");
      const href = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.getAttribute?.("href") ?? null,
      );
      if (
        href === "/#about" ||
        href === "/#specialties" ||
        href === "/articles" ||
        href === "/bookshelf" ||
        href === "/#contact"
      ) {
        landed = true;
        break;
      }
    }
    expect(landed, "Expected to reach a primary nav link via Tab").toBeTruthy();

    const styles = await snapshotFocusedStyles(page);
    expect(
      hasVisibleFocusIndicator(styles),
      `Expected visible focus styles, got ${JSON.stringify(styles)}`,
    ).toBeTruthy();
    expect(styles.tag).toMatch(/A|BUTTON/);
  });

  test("mobile menu opens with keyboard and closes on Escape", async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await gotoPublic(page, "/");

    const toggle = page.locator('button[aria-controls="mobile-nav-menu"]');
    await expect(toggle).toBeVisible();

    await openMobileMenuWithKeyboard(page);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toHaveAttribute("aria-label", "Close menu");

    const menu = page.locator("#mobile-nav-menu");
    await expect(menu).toBeVisible();
    await expect(menu.locator("a").first()).toBeVisible();

    await closeMobileMenuWithEscape(page);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute("aria-label", "Open menu");
  });

  test("no obvious keyboard trap across early tab sequence", async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoPublic(page, "/");
    const result = await assertNoObviousKeyboardTrap(page, 18);
    expect(result.uniqueFocusKeys).toBeGreaterThanOrEqual(3);
  });

  for (const path of ["/articles", "/bookshelf"] as const) {
    test(`${path} skip target works`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await gotoPublic(page, path);
      await expect(page.locator("[data-site-theme]")).toBeAttached();
      await activateSkipAndLandOnMain(page);
      await expect(page.locator("#main-content")).toBeFocused();
    });
  }
});
