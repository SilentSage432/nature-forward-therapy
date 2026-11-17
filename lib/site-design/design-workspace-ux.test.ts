import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  FONT_PAIRING_GALLERY_LAYOUT,
  PALETTE_GALLERY_LAYOUT,
} from "@/components/admin/studio/DesignControlPanel";
import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";
import {
  BODY_SCALE_OPTIONS,
  FONT_FAMILY_GROUPS,
  FONT_FAMILY_OPTIONS,
  HEADING_SCALE_OPTIONS,
  THEME_PALETTE_GROUPS,
  THEME_PALETTE_OPTIONS,
} from "@/lib/site-design/options";
import {
  getPublishEligibility,
  publishEligibilityHint,
} from "@/lib/site-design/publish-ui";
import { parseSiteDesign } from "@/lib/site-design/schema";
import { designsEqual } from "@/lib/site-design/studio-status";
import {
  createStudioPreviewSetDesignMessage,
  isStudioPreviewMessage,
} from "@/lib/site-design/preview-protocol";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

describe("design workspace UX contract (008-ENG01)", () => {
  it("keeps all 15 palettes and 9 pairings reachable via compact pickers", () => {
    assert.equal(THEME_PALETTE_OPTIONS.length, 15);
    assert.equal(FONT_FAMILY_OPTIONS.length, 9);
    assert.equal(THEME_PALETTE_GROUPS.length, 4);
    assert.equal(FONT_FAMILY_GROUPS.length, 3);
    assert.ok(THEME_PALETTE_GROUPS.every((group) => group.options.length > 0));
    assert.ok(FONT_FAMILY_GROUPS.every((group) => group.options.length > 0));
  });

  it("preserves scale inventories for segmented controls", () => {
    assert.deepEqual(
      HEADING_SCALE_OPTIONS.map((option) => option.id),
      ["comfortable", "prominent", "compact"],
    );
    assert.deepEqual(
      BODY_SCALE_OPTIONS.map((option) => option.id),
      ["comfortable", "relaxed", "compact"],
    );
  });

  it("validates every curated combination through SiteDesign schema", () => {
    for (const theme of THEME_PALETTE_OPTIONS) {
      for (const font of FONT_FAMILY_OPTIONS) {
        for (const heading of HEADING_SCALE_OPTIONS) {
          for (const body of BODY_SCALE_OPTIONS) {
            const design = cloneCanonicalSiteDesign();
            design.theme.presetId = theme.id;
            design.typography.fontFamilyId = font.id;
            design.typography.headingScaleId = heading.id;
            design.typography.bodyScaleId = body.id;
            const parsed = parseSiteDesign(design);
            assert.equal(parsed.ok, true);
          }
        }
      }
    }
  });

  it("keeps dirty-state detection independent of revisions", () => {
    const baseline = cloneCanonicalSiteDesign();
    const draft = cloneCanonicalSiteDesign();
    assert.equal(designsEqual(baseline, draft), true);
    draft.theme.presetId = "coastal-mist";
    assert.equal(designsEqual(baseline, draft), false);
    draft.theme.presetId = baseline.theme.presetId;
    draft.typography.fontFamilyId = "literary";
    assert.equal(designsEqual(baseline, draft), false);
    draft.typography.fontFamilyId = baseline.typography.fontFamilyId;
    draft.typography.headingScaleId = "prominent";
    assert.equal(designsEqual(baseline, draft), false);
  });

  it("preserves publish eligibility: dirty blocks, saved divergent allows", () => {
    const published = cloneCanonicalSiteDesign();
    const draft = cloneCanonicalSiteDesign();
    draft.theme.presetId = "dusk-sage";

    const dirtyBlocked = getPublishEligibility({
      dirty: true,
      pending: false,
      draft,
      published,
    });
    assert.equal(dirtyBlocked.canRequestPublish, false);
    if (!dirtyBlocked.canRequestPublish) {
      assert.equal(dirtyBlocked.reason, "unsaved");
    }
    assert.match(publishEligibilityHint(dirtyBlocked) ?? "", /save/i);

    const eligible = getPublishEligibility({
      dirty: false,
      pending: false,
      draft,
      published,
    });
    assert.equal(eligible.canRequestPublish, true);
    assert.equal(publishEligibilityHint(eligible), null);

    const matching = getPublishEligibility({
      dirty: false,
      pending: false,
      draft: published,
      published,
    });
    assert.equal(matching.canRequestPublish, false);
  });

  it("preview SET_DESIGN messages still carry full SiteDesign payloads", () => {
    for (const theme of THEME_PALETTE_OPTIONS) {
      const design = cloneCanonicalSiteDesign();
      design.theme.presetId = theme.id;
      const message = createStudioPreviewSetDesignMessage(design);
      assert.equal(isStudioPreviewMessage(message), true);
      assert.equal(message.type, "STUDIO_PREVIEW_SET_DESIGN");
      assert.equal(message.design.theme.presetId, theme.id);
    }
  });

  it("compact picker layout avoids viewport sm:grid-cols-2 and keeps swatches", () => {
    assert.match(PALETTE_GALLERY_LAYOUT.containerClassName, /@container/);
    assert.match(PALETTE_GALLERY_LAYOUT.gridClassName, /grid-cols-1/);
    assert.match(PALETTE_GALLERY_LAYOUT.gridClassName, /@\[26rem\]:grid-cols-2/);
    assert.doesNotMatch(
      PALETTE_GALLERY_LAYOUT.gridClassName,
      /\bsm:grid-cols-2\b/,
    );
    assert.match(FONT_PAIRING_GALLERY_LAYOUT.gridClassName, /grid-cols-1/);

    const controlSource = readFileSync(
      path.join(repoRoot, "components/admin/studio/DesignControlPanel.tsx"),
      "utf8",
    );
    assert.match(controlSource, /data-palette-trigger=/);
    assert.match(controlSource, /data-font-trigger=/);
    assert.match(controlSource, /data-palette-card=/);
    assert.match(controlSource, /data-font-card=/);
    assert.match(controlSource, /data-scale-segmented=/);
    assert.match(controlSource, /type="radio"/);
    assert.match(controlSource, /role="radiogroup"/);
    assert.match(controlSource, /data-palette-swatches=/);
    assert.match(controlSource, /aria-expanded/);
  });

  it("DesignEditor uses persistent preview panes without four status cards", () => {
    const editorSource = readFileSync(
      path.join(repoRoot, "components/admin/studio/DesignEditor.tsx"),
      "utf8",
    );
    assert.doesNotMatch(editorSource, /StudioStatusCards/);
    assert.match(editorSource, /data-design-workspace-panes=/);
    assert.match(editorSource, /data-design-preview-persist=/);
    assert.match(editorSource, /data-design-control-scroll=/);
    assert.match(editorSource, /data-design-session-strip=/);
    assert.match(editorSource, /data-design-status-compact=/);
    assert.match(editorSource, /xl:sticky/);
    assert.match(editorSource, /Save Draft/);
    assert.match(editorSource, /Publish…/);
    assert.match(editorSource, /getPublishEligibility/);
  });

  it("Design page invalid path may still show status cards; Overview retains them", () => {
    const designPage = readFileSync(
      path.join(repoRoot, "app/admin/studio/design/page.tsx"),
      "utf8",
    );
    const overviewPage = readFileSync(
      path.join(repoRoot, "app/admin/studio/page.tsx"),
      "utf8",
    );
    assert.match(overviewPage, /StudioStatusCards/);
    assert.match(designPage, /StudioStatusCards/);
    assert.match(designPage, /INVALID_DESIGN/);
  });
});
