import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  formatAxeFailure,
  persistAxeSummary,
  runAxeOnPage,
} from "./helpers/axe";
import {
  PUBLISHED_DEFAULT_PALETTE_ID,
  advisoryViolationsAreAcceptable,
  axeEnforcementForPaletteSample,
} from "./helpers/enforcement-policy";
import {
  createRunEnforcementSummary,
  formatEnforcementConsoleSummary,
  markEnforcedNote,
  persistEnforcementSummary,
  recordAdvisoryAxeSample,
  recordManualIncomplete,
} from "./helpers/enforcement-report";
import { gotoPublic } from "./helpers/goto";
import {
  LIGHT_AIRY_REMEDIATION_PALETTES,
  REPRESENTATIVE_FONTS,
  REPRESENTATIVE_PALETTES,
  applyEphemeralPresentation,
} from "./helpers/palette";
import { VIEWPORTS } from "./helpers/routes";

const REMEDIATED_SELECTOR_HINT =
  /\.focus-pill|\.site-accent-soft-muted|focus-pill|site-accent-soft-muted/i;

test.describe("Representative palette / typography sampling (ephemeral DOM)", () => {
  test("documents strategy and samples light + dark without SiteDesign writes", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push({
      type: "strategy",
      description:
        "Ephemeral data-site-theme / data-site-font mutation on public homepage only. No auth, no Studio, no Save Draft / Publish. Exhaustive matrix deferred.",
    });
    testInfo.annotations.push({
      type: "enforcement",
      description:
        `Published/default (${PUBLISHED_DEFAULT_PALETTE_ID}) axe is enforced. Alternate palettes are advisory: violations are recorded; zero violations is valid.`,
    });

    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoPublic(page, "/");

    const enforcement = createRunEnforcementSummary();
    const findings: Array<{
      theme: string;
      font: string;
      enforcement: "enforced" | "advisory";
      violationCount: number;
      incompleteCount: number;
      accent: string;
      surface: string;
    }> = [];

    for (const palette of REPRESENTATIVE_PALETTES) {
      for (const font of REPRESENTATIVE_FONTS) {
        const applied = await applyEphemeralPresentation(page, {
          themeId: palette.id,
          fontId: font.id,
        });
        expect(applied.theme).toBe(palette.id);
        expect(applied.font).toBe(font.id);

        const tokens = await page.evaluate(() => {
          const root = document.querySelector("[data-site-theme]");
          if (!root) return { accent: "", surface: "" };
          const cs = getComputedStyle(root);
          return {
            accent: cs.getPropertyValue("--site-accent").trim(),
            surface: cs.getPropertyValue("--site-surface-page").trim(),
          };
        });
        expect(tokens.accent.length).toBeGreaterThan(0);
        expect(tokens.surface.length).toBeGreaterThan(0);

        const axe = await runAxeOnPage(page, {
          route: "/",
          viewport: VIEWPORTS.desktop.label,
          theme: `${palette.id}+${font.id}`,
        });
        persistAxeSummary(axe, `palette-${palette.id}-${font.id}`);
        recordManualIncomplete(enforcement, {
          context: `palette ${palette.id}+${font.id}`,
          axe,
        });

        const lane = axeEnforcementForPaletteSample(palette.id);
        findings.push({
          theme: palette.id,
          font: font.id,
          enforcement: lane,
          violationCount: axe.violations.length,
          incompleteCount: axe.incomplete.length,
          accent: tokens.accent,
          surface: tokens.surface,
        });

        if (lane === "enforced") {
          expect(axe.violations, formatAxeFailure(axe)).toEqual([]);
          markEnforcedNote(
            enforcement,
            `${palette.id}+${font.id}: enforced axe clean (${axe.violations.length} violations)`,
          );
        } else {
          // Advisory: record evidence. Zero violations is valid — never require gaps.
          expect(
            advisoryViolationsAreAcceptable(axe.violations.length),
            "Advisory palette samples must accept zero or more violations",
          ).toBeTruthy();
          recordAdvisoryAxeSample(enforcement, {
            paletteId: palette.id,
            fontId: font.id,
            axe,
          });
          for (const violation of axe.violations) {
            testInfo.annotations.push({
              type: "advisory-axe-finding",
              description: `${palette.id}+${font.id}: [${violation.impact}] ${violation.id} — ${violation.help}`,
            });
          }
          if (axe.violations.length === 0) {
            testInfo.annotations.push({
              type: "advisory-axe-clean",
              description: `${palette.id}+${font.id}: no axe violations (valid advisory outcome)`,
            });
          }
        }
      }
    }

    const report = {
      strategy: REPRESENTATIVE_PALETTES,
      fonts: REPRESENTATIVE_FONTS,
      findings,
      enforcement: {
        publishedDefault: PUBLISHED_DEFAULT_PALETTE_ID,
        note:
          "Enforced lane = published/default only. Advisory lane records alternate-palette axe evidence without requiring violations to exist. Not a WCAG certificate.",
      },
      disclaimer:
        "axe-core ≠ WCAG certificate. Suite green does not mean all sampled palettes are violation-free.",
    };
    const reportDir = path.resolve("tmp/a11y");
    mkdirSync(reportDir, { recursive: true });
    writeFileSync(
      path.join(reportDir, "palette-rendered-findings.json"),
      JSON.stringify(report, null, 2),
    );
    persistEnforcementSummary(enforcement);
    const consoleSummary = formatEnforcementConsoleSummary(enforcement);
    console.log(consoleSummary);
    await testInfo.attach("palette-typography-sample", {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: "application/json",
    });
    await testInfo.attach("enforcement-summary", {
      body: Buffer.from(consoleSummary),
      contentType: "text/plain",
    });

    // Sanity: light and dark samples actually differ in surface token.
    const forest = findings.find((f) => f.theme === "forest-gold");
    const coastal = findings.find((f) => f.theme === "coastal-mist");
    const midnight = findings.find((f) => f.theme === "midnight-garden");
    expect(forest && coastal && midnight).toBeTruthy();
    expect(forest!.surface).not.toEqual(coastal!.surface);
    expect(forest!.enforcement).toBe("enforced");
    expect(forest!.violationCount).toBe(0);
    expect(midnight!.violationCount).toBe(0);
    expect(coastal!.enforcement).toBe("advisory");
    // FIX01: zero advisory violations is valid — ENG04 remediation targets clean.
    expect(advisoryViolationsAreAcceptable(coastal!.violationCount)).toBeTruthy();

    // ENG04-ENG01: remediates selectors covered by the dedicated probe below.
    // Advisory lane still accepts zero-or-more total violations (FIX01).
    for (const paletteId of LIGHT_AIRY_REMEDIATION_PALETTES) {
      for (const font of REPRESENTATIVE_FONTS) {
        const sample = findings.find(
          (f) => f.theme === paletteId && f.font === font.id,
        );
        expect(sample, `${paletteId}+${font.id} sampled`).toBeTruthy();
        expect(
          advisoryViolationsAreAcceptable(sample!.violationCount),
        ).toBeTruthy();
      }
    }
  });

  test("ENG04 light remaps keep remediates selectors contrast-clean across fonts", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoPublic(page, "/");

    const probe: Array<{
      theme: string;
      font: string;
      softMuted: { color: string; background: string };
      focusPill: { color: string; background: string };
      remediatedContrastViolations: number;
    }> = [];

    for (const paletteId of LIGHT_AIRY_REMEDIATION_PALETTES) {
      for (const font of REPRESENTATIVE_FONTS) {
        await applyEphemeralPresentation(page, {
          themeId: paletteId,
          fontId: font.id,
        });

        const computed = await page.evaluate(() => {
          const root = document.querySelector<HTMLElement>("[data-site-theme]");
          const soft = document.querySelector<HTMLElement>(
            ".site-accent-soft-muted",
          );
          const pill = document.querySelector<HTMLElement>(".focus-pill");
          const accent = root
            ? getComputedStyle(root).getPropertyValue("--site-accent").trim()
            : "";
          const read = (el: HTMLElement | null) => {
            if (!el) return { color: "", background: "" };
            const cs = getComputedStyle(el);
            return { color: cs.color, background: cs.backgroundColor };
          };
          return {
            accent,
            softMuted: read(soft),
            focusPill: read(pill),
          };
        });

        // Option B: both remapped utilities resolve to opaque accent.
        expect(computed.accent.length).toBeGreaterThan(0);
        expect(computed.softMuted.color).toBe(computed.focusPill.color);

        const axe = await runAxeOnPage(page, {
          route: "/",
          viewport: VIEWPORTS.desktop.label,
          theme: `eng04-${paletteId}+${font.id}`,
        });
        const remediated = axe.violations.filter(
          (v) =>
            v.id === "color-contrast" &&
            v.nodes.some(
              (n) =>
                REMEDIATED_SELECTOR_HINT.test(n.html) ||
                n.target.some((t) => REMEDIATED_SELECTOR_HINT.test(String(t))),
            ),
        );
        expect(
          remediated,
          formatAxeFailure({
            ...axe,
            violations: remediated,
          }),
        ).toEqual([]);
        expect(axe.violations.filter((v) => v.id === "color-contrast")).toEqual(
          [],
        );

        probe.push({
          theme: paletteId,
          font: font.id,
          softMuted: computed.softMuted,
          focusPill: computed.focusPill,
          remediatedContrastViolations: remediated.length,
        });
      }
    }

    const reportDir = path.resolve("tmp/a11y");
    mkdirSync(reportDir, { recursive: true });
    writeFileSync(
      path.join(reportDir, "eng04-eng01-light-remap-probe.json"),
      JSON.stringify({ probe }, null, 2),
    );
    await testInfo.attach("eng04-light-remap-probe", {
      body: Buffer.from(JSON.stringify({ probe }, null, 2)),
      contentType: "application/json",
    });
  });

  test("mobile menu semantics remain coherent under a light palette", async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await gotoPublic(page, "/");
    await applyEphemeralPresentation(page, { themeId: "coastal-mist" });

    const toggle = page.locator('button[aria-controls="mobile-nav-menu"]');
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#mobile-nav-menu a").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("ENG04 specialties + footer remain readable at 390/768/1280", async ({
    page,
  }, testInfo) => {
    await gotoPublic(page, "/");
    const viewports = [
      VIEWPORTS.mobile,
      VIEWPORTS.tablet,
      VIEWPORTS.desktop,
    ] as const;
    const rows: Array<{
      theme: string;
      viewport: string;
      softMutedColor: string;
      pillColor: string;
      pillOverflow: boolean;
      footerOverflow: boolean;
      focusOutline: string;
    }> = [];

    for (const theme of [
      "forest-gold",
      "coastal-mist",
      "lavender-meadow",
    ] as const) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await applyEphemeralPresentation(page, { themeId: theme });

        const specialties = page.locator("#specialties");
        const footer = page.locator("footer");
        await expect(specialties).toBeVisible();
        await expect(footer).toBeVisible();
        await expect(page.locator(".focus-pill").first()).toBeVisible();
        await expect(page.locator(".site-accent-soft-muted").first()).toBeVisible();

        const metrics = await page.evaluate(() => {
          const pill = document.querySelector<HTMLElement>(".focus-pill");
          const soft = document.querySelector<HTMLElement>(
            ".site-accent-soft-muted",
          );
          const footerEl = document.querySelector("footer");
          const overflowX = (el: Element | null) => {
            if (!el) return true;
            const r = el.getBoundingClientRect();
            return r.right > window.innerWidth + 1 || r.left < -1;
          };
          const focusTarget =
            document.querySelector<HTMLElement>("footer a") ?? soft;
          focusTarget?.focus();
          const focusCs = focusTarget
            ? getComputedStyle(focusTarget)
            : null;
          return {
            softMutedColor: soft ? getComputedStyle(soft).color : "",
            pillColor: pill ? getComputedStyle(pill).color : "",
            pillOverflow: overflowX(pill),
            footerOverflow: overflowX(footerEl),
            focusOutline: focusCs
              ? `${focusCs.outlineStyle} ${focusCs.outlineWidth} ${focusCs.outlineColor}`
              : "",
          };
        });

        expect(metrics.pillOverflow).toBe(false);
        expect(metrics.footerOverflow).toBe(false);
        rows.push({ theme, viewport: vp.label, ...metrics });
      }
    }

    const reportDir = path.resolve("tmp/a11y");
    mkdirSync(reportDir, { recursive: true });
    writeFileSync(
      path.join(reportDir, "eng04-eng01-responsive-probe.json"),
      JSON.stringify({ rows }, null, 2),
    );
    await testInfo.attach("eng04-responsive-probe", {
      body: Buffer.from(JSON.stringify({ rows }, null, 2)),
      contentType: "application/json",
    });
  });
});
