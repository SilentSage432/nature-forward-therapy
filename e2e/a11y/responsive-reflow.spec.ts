import { expect, test } from "@playwright/test";
import { gotoPublic } from "./helpers/goto";
import {
  persistReflowProbes,
  probeCssTextResize200,
  probeCssZoomApprox,
  probeViewportReflow,
  probeZoomEquivalentReflow,
  type ReflowProbe,
} from "./helpers/reflow";
import { VIEWPORTS } from "./helpers/routes";

function assertReflowProbe(probe: ReflowProbe, opts?: { allowOverflow?: boolean }) {
  if (!opts?.allowOverflow) {
    expect(
      probe.horizontalOverflow,
      `${probe.label}: horizontal overflow scrollWidth=${probe.scrollWidth} clientWidth=${probe.clientWidth}`,
    ).toBeFalsy();
  }
  expect(
    probe.clippedControls,
    `${probe.label}: clipped controls ${JSON.stringify(probe.clippedControls)}`,
  ).toEqual([]);
  expect(probe.headingWrapOk, `${probe.label}: heading wrap`).toBeTruthy();
  expect(probe.paragraphWrapOk, `${probe.label}: paragraph wrap`).toBeTruthy();
}

test.describe("Responsive / reflow probes (not WCAG reflow certification)", () => {
  test("homepage viewports 390 / 768 / 1280", async ({ page }, testInfo) => {
    await gotoPublic(page, "/");
    const probes: ReflowProbe[] = [];

    for (const vp of [
      VIEWPORTS.mobile,
      VIEWPORTS.tablet,
      VIEWPORTS.desktop,
    ]) {
      probes.push(
        await probeViewportReflow(
          page,
          { width: vp.width, height: vp.height },
          vp.label,
        ),
      );
    }

    persistReflowProbes(probes, "homepage-viewports");
    await testInfo.attach("reflow-homepage-viewports", {
      body: Buffer.from(JSON.stringify(probes, null, 2)),
      contentType: "application/json",
    });

    for (const probe of probes) {
      assertReflowProbe(probe);
    }
  });

  test("articles + bookshelf desktop overflow check", async ({ page }) => {
    for (const path of ["/articles", "/bookshelf"]) {
      await gotoPublic(page, path);
      const probe = await probeViewportReflow(
        page,
        VIEWPORTS.desktop,
        `${path}-desktop`,
      );
      assertReflowProbe(probe);
    }
  });

  test("200% CSS text-resize and 400% zoom-equivalent approximations", async ({
    page,
  }, testInfo) => {
    await gotoPublic(page, "/");

    const text200 = await probeCssTextResize200(page, VIEWPORTS.desktop);
    const reflow400 = await probeZoomEquivalentReflow(page);
    const cssZoom = await probeCssZoomApprox(page, VIEWPORTS.desktop);

    const probes = [text200, reflow400, cssZoom];
    persistReflowProbes(probes, "homepage-text-zoom-approximations");
    await testInfo.attach("reflow-approximations", {
      body: Buffer.from(JSON.stringify(probes, null, 2)),
      contentType: "application/json",
    });

    // Soft-fail reporting: record sticky notes but assert structural overflow.
    for (const probe of probes) {
      assertReflowProbe(probe);
    }

    testInfo.annotations.push({
      type: "limitation",
      description:
        "These probes distinguish viewport simulation, CSS text resize, and CSS zoom approx from true browser zoom. They do not prove WCAG 1.4.10 reflow conformance.",
    });
  });
});
