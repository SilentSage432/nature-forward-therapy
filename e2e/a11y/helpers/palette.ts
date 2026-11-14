/**
 * Safe rendered palette/typography sampling strategy.
 *
 * Does NOT:
 * - authenticate
 * - open Studio
 * - save drafts / publish designs
 * - mutate production SiteDesign rows
 *
 * DOES:
 * - temporarily set `data-site-theme` / `data-site-font` on the already-rendered
 *   public `[data-site-theme]` root so static CSS scopes apply in this browser
 *   session only (ephemeral DOM; discarded on navigation/reload).
 *
 * Selection: representative dark + light palettes and chrome-delivered fonts
 * (classic / editorial / modern). Exhaustive 15×9 matrix is DEFERRED.
 */

export const REPRESENTATIVE_PALETTES = [
  { id: "forest-gold", mode: "dark", reason: "canonical published default" },
  { id: "midnight-garden", mode: "dark", reason: "representative deep-calm dark" },
  { id: "coastal-mist", mode: "light", reason: "representative light-airy" },
  { id: "lavender-meadow", mode: "light", reason: "second light-airy sample" },
  {
    id: "botanical-cream",
    mode: "light",
    reason: "ENG04 light-airy remediation coverage",
  },
  {
    id: "misty-morning",
    mode: "light",
    reason: "ENG04 light-airy remediation coverage",
  },
] as const;

/** Light & Airy palettes remapped in ENG04-ENG01 Option B. */
export const LIGHT_AIRY_REMEDIATION_PALETTES = [
  "coastal-mist",
  "lavender-meadow",
  "botanical-cream",
  "misty-morning",
] as const;

/** Public chrome fonts always available without Studio supplemental delivery. */
export const REPRESENTATIVE_FONTS = [
  { id: "classic", reason: "canonical / chrome-delivered" },
  { id: "editorial", reason: "chrome-delivered Cormorant pairing" },
  { id: "modern", reason: "chrome-delivered Inter pairing" },
] as const;

export async function applyEphemeralPresentation(
  page: import("@playwright/test").Page,
  options: { themeId?: string; fontId?: string },
): Promise<{ theme: string | null; font: string | null }> {
  const applied = await page.evaluate(({ themeId, fontId }) => {
    const root = document.querySelector<HTMLElement>("[data-site-theme]");
    if (!root) {
      return { theme: null, font: null };
    }
    // Ephemeral sampling must not measure mid-`transition-colors` frames
    // (focus pills / footer links otherwise retain the prior palette briefly).
    let freeze = document.getElementById("a11y-ephemeral-transition-freeze");
    if (!freeze) {
      freeze = document.createElement("style");
      freeze.id = "a11y-ephemeral-transition-freeze";
      freeze.textContent =
        "[data-site-theme], [data-site-theme] * { transition: none !important; }";
      document.head.appendChild(freeze);
    }
    if (themeId) root.setAttribute("data-site-theme", themeId);
    if (fontId) root.setAttribute("data-site-font", fontId);
    return {
      theme: root.getAttribute("data-site-theme"),
      font: root.getAttribute("data-site-font"),
    };
  }, options);

  if (options.themeId && applied.theme === options.themeId) {
    await page.waitForFunction(
      (themeId) => {
        const root = document.querySelector<HTMLElement>("[data-site-theme]");
        if (!root || root.getAttribute("data-site-theme") !== themeId) {
          return false;
        }
        const accent = getComputedStyle(root)
          .getPropertyValue("--site-accent")
          .trim();
        return accent.length > 0;
      },
      options.themeId,
      { timeout: 5_000 },
    );
  }

  return applied;
}
