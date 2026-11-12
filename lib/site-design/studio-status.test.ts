import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";
import {
  deriveStudioWorkspaceStatus,
  designsEqual,
  themeDisplayName,
} from "@/lib/site-design/studio-status";

describe("studio status helpers", () => {
  it("labels forest-gold as Forest & Gold", () => {
    assert.equal(themeDisplayName("forest-gold"), "Forest & Gold");
  });

  it("compares designs by stable payload, not revision numbers alone", () => {
    const a = cloneCanonicalSiteDesign();
    const b = cloneCanonicalSiteDesign();
    assert.equal(designsEqual(a, b), true);
    b.hero.focalPoint.x = 0.2;
    assert.equal(designsEqual(a, b), false);
  });

  it("reports canonical-default when nothing has been published", () => {
    const design = cloneCanonicalSiteDesign();
    const status = deriveStudioWorkspaceStatus({
      draft: design,
      published: design,
      draftRevision: 0,
      publishedRevision: 0,
      draftUpdatedAt: null,
      draftUpdatedByEmail: null,
      publishedAt: null,
      publishedByEmail: null,
      draftValid: true,
      publishedValid: true,
    });
    assert.equal(status.liveMode, "canonical-default");
    assert.equal(status.draftRelation, "matches-published");
    assert.equal(status.hasBeenPublished, false);
    assert.match(status.liveSummary, /default/i);
  });

  it("reports unpublished-changes when draft differs from published", () => {
    const published = cloneCanonicalSiteDesign();
    const draft = cloneCanonicalSiteDesign();
    draft.hero.focalPoint = { x: 0.3, y: 0.4 };
    const status = deriveStudioWorkspaceStatus({
      draft,
      published,
      draftRevision: 2,
      publishedRevision: 1,
      draftUpdatedAt: "2026-11-11T00:00:00.000Z",
      draftUpdatedByEmail: "editor@example.test",
      publishedAt: "2026-11-10T00:00:00.000Z",
      publishedByEmail: "editor@example.test",
      draftValid: true,
      publishedValid: true,
    });
    assert.equal(status.liveMode, "published-design");
    assert.equal(status.draftRelation, "unpublished-changes");
    assert.equal(status.hasBeenPublished, true);
  });

  it("does not treat revision mismatch alone as unpublished changes", () => {
    const design = cloneCanonicalSiteDesign();
    const status = deriveStudioWorkspaceStatus({
      draft: design,
      published: design,
      draftRevision: 3,
      publishedRevision: 1,
      draftUpdatedAt: null,
      draftUpdatedByEmail: null,
      publishedAt: "2026-11-10T00:00:00.000Z",
      publishedByEmail: "editor@example.test",
      draftValid: true,
      publishedValid: true,
    });
    assert.equal(status.draftRelation, "matches-published");
  });
});

describe("studio RBAC path coverage", () => {
  it("allows EDITOR access to /admin/studio paths", async () => {
    const { canAccessAdminPath } = await import("@/lib/rbac");
    assert.equal(canAccessAdminPath("EDITOR", "/admin/studio"), true);
    assert.equal(canAccessAdminPath("EDITOR", "/admin/studio/design"), true);
    assert.equal(canAccessAdminPath("DEVELOPER", "/admin/studio"), true);
    assert.equal(canAccessAdminPath(undefined, "/admin/studio"), false);
  });
});

describe("studio live preview presentation", () => {
  it("labels unpublished state as canonical-default, not published", async () => {
    const { cloneCanonicalSiteDesign } = await import(
      "@/lib/site-design/defaults"
    );
    const { presentationForLivePreview } = await import(
      "@/lib/site-design/studio-load"
    );
    const result = presentationForLivePreview({
      published: cloneCanonicalSiteDesign(),
      publishedRevision: 0,
    });
    assert.equal(result.presentation.source, "canonical-default");
    assert.equal(result.presentation.publishedRevision, null);
    assert.match(result.caption, /not a draft preview|default/i);
  });

  it("labels published revision as published source", async () => {
    const { cloneCanonicalSiteDesign } = await import(
      "@/lib/site-design/defaults"
    );
    const { presentationForLivePreview } = await import(
      "@/lib/site-design/studio-load"
    );
    const result = presentationForLivePreview({
      published: cloneCanonicalSiteDesign(),
      publishedRevision: 2,
    });
    assert.equal(result.presentation.source, "published");
    assert.equal(result.presentation.publishedRevision, 2);
    assert.match(result.caption, /not a draft preview/i);
  });
});
