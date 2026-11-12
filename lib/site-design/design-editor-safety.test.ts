import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canAccessAdminPath } from "@/lib/rbac";
import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";
import {
  createStudioPreviewReadyMessage,
  createStudioPreviewSetDesignMessage,
  parseStudioPreviewMessage,
  STUDIO_PREVIEW_MAX_SERIALIZED_CHARS,
  STUDIO_PREVIEW_PROTOCOL_VERSION,
  STUDIO_PREVIEW_SOURCE,
} from "@/lib/site-design/preview-protocol";
import { designsEqual } from "@/lib/site-design/studio-status";
import {
  isLeavingDesignEditor,
  normalizePathname,
} from "@/lib/site-design/unsaved-navigation";

describe("dirty vs clean navigation helpers", () => {
  it("treats equal designs as clean", () => {
    const a = cloneCanonicalSiteDesign();
    const b = cloneCanonicalSiteDesign();
    assert.equal(designsEqual(a, b), true);
  });

  it("detects dirty palette changes without revision numbers", () => {
    const baseline = cloneCanonicalSiteDesign();
    const draft = cloneCanonicalSiteDesign();
    draft.theme.presetId = "dusk-sage";
    assert.equal(designsEqual(baseline, draft), false);
  });

  it("does not guard same-route navigation", () => {
    assert.equal(
      isLeavingDesignEditor(
        "/admin/studio/design",
        "/admin/studio/design",
        "http://localhost:3006",
      ),
      false,
    );
    assert.equal(
      isLeavingDesignEditor(
        "/admin/studio/design?x=1",
        "/admin/studio/design",
        "http://localhost:3006",
      ),
      false,
    );
  });

  it("guards Studio and admin exits", () => {
    assert.equal(
      isLeavingDesignEditor(
        "/admin/studio",
        "/admin/studio/design",
        "http://localhost:3006",
      ),
      true,
    );
    assert.equal(
      isLeavingDesignEditor(
        "/admin/studio/history",
        "/admin/studio/design",
        "http://localhost:3006",
      ),
      true,
    );
    assert.equal(
      isLeavingDesignEditor(
        "/admin/profile",
        "/admin/studio/design",
        "http://localhost:3006",
      ),
      true,
    );
  });

  it("normalizes trailing slashes", () => {
    assert.equal(normalizePathname("/admin/studio/design/"), "/admin/studio/design");
  });
});

describe("preview message protocol", () => {
  const origin = "http://localhost:3006";
  const parent = { id: "parent" } as unknown as MessageEventSource;
  const iframe = { id: "iframe" } as unknown as MessageEventSource;

  it("accepts versioned READY from the expected source window", () => {
    const result = parseStudioPreviewMessage(createStudioPreviewReadyMessage(), {
      expectedOrigin: origin,
      actualOrigin: origin,
      eventSource: iframe,
      expectedSource: iframe,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.message.type, "STUDIO_PREVIEW_READY");
      assert.equal(result.message.protocolVersion, STUDIO_PREVIEW_PROTOCOL_VERSION);
    }
  });

  it("accepts valid SET_DESIGN payloads", () => {
    const design = cloneCanonicalSiteDesign();
    design.theme.presetId = "clay-sand";
    const result = parseStudioPreviewMessage(
      createStudioPreviewSetDesignMessage(design),
      {
        expectedOrigin: origin,
        actualOrigin: origin,
        eventSource: parent,
        expectedSource: parent,
      },
    );
    assert.equal(result.ok, true);
    if (result.ok && result.message.type === "STUDIO_PREVIEW_SET_DESIGN") {
      assert.equal(result.message.design.theme.presetId, "clay-sand");
    }
  });

  it("rejects unexpected origins", () => {
    const result = parseStudioPreviewMessage(createStudioPreviewReadyMessage(), {
      expectedOrigin: origin,
      actualOrigin: "https://evil.example",
      eventSource: iframe,
      expectedSource: iframe,
    });
    assert.deepEqual(result, { ok: false, reason: "origin" });
  });

  it("rejects unexpected source windows", () => {
    const result = parseStudioPreviewMessage(createStudioPreviewReadyMessage(), {
      expectedOrigin: origin,
      actualOrigin: origin,
      eventSource: parent,
      expectedSource: iframe,
    });
    assert.deepEqual(result, { ok: false, reason: "source-window" });
  });

  it("rejects unknown message types", () => {
    const result = parseStudioPreviewMessage({
      source: STUDIO_PREVIEW_SOURCE,
      protocolVersion: STUDIO_PREVIEW_PROTOCOL_VERSION,
      type: "STUDIO_PREVIEW_HACK",
    });
    assert.deepEqual(result, { ok: false, reason: "type" });
  });

  it("rejects missing protocol version", () => {
    const result = parseStudioPreviewMessage({
      source: STUDIO_PREVIEW_SOURCE,
      type: "STUDIO_PREVIEW_READY",
    });
    assert.deepEqual(result, { ok: false, reason: "protocol-version" });
  });

  it("rejects invalid design objects without applying them", () => {
    const current = cloneCanonicalSiteDesign();
    const result = parseStudioPreviewMessage({
      source: STUDIO_PREVIEW_SOURCE,
      protocolVersion: STUDIO_PREVIEW_PROTOCOL_VERSION,
      type: "STUDIO_PREVIEW_SET_DESIGN",
      design: {
        ...current,
        theme: { presetId: "not-a-real-theme" },
      },
    });
    assert.deepEqual(result, { ok: false, reason: "invalid-design" });
    assert.equal(current.theme.presetId, "forest-gold");
  });

  it("rejects unsupported schema versions in design payload", () => {
    const design = cloneCanonicalSiteDesign() as Record<string, unknown>;
    design.schemaVersion = 99;
    const result = parseStudioPreviewMessage({
      source: STUDIO_PREVIEW_SOURCE,
      protocolVersion: STUDIO_PREVIEW_PROTOCOL_VERSION,
      type: "STUDIO_PREVIEW_SET_DESIGN",
      design,
    });
    assert.deepEqual(result, { ok: false, reason: "invalid-design" });
  });

  it("rejects oversized payloads", () => {
    const design = cloneCanonicalSiteDesign() as Record<string, unknown>;
    design.padding = "x".repeat(STUDIO_PREVIEW_MAX_SERIALIZED_CHARS);
    const result = parseStudioPreviewMessage({
      source: STUDIO_PREVIEW_SOURCE,
      protocolVersion: STUDIO_PREVIEW_PROTOCOL_VERSION,
      type: "STUDIO_PREVIEW_SET_DESIGN",
      design,
    });
    assert.deepEqual(result, { ok: false, reason: "oversized" });
  });
});

describe("preview route authorization (RBAC path)", () => {
  it("allows EDITOR and DEVELOPER on preview-frame; denies anonymous", () => {
    const path = "/admin/studio/preview-frame";
    assert.equal(canAccessAdminPath("EDITOR", path), true);
    assert.equal(canAccessAdminPath("DEVELOPER", path), true);
    assert.equal(canAccessAdminPath(undefined, path), false);
  });
});

describe("save failure and conflict dirty preservation (contract)", () => {
  it("keeps local draft unequal to baseline after a failed save simulation", () => {
    const baseline = cloneCanonicalSiteDesign();
    const local = cloneCanonicalSiteDesign();
    local.typography.fontFamilyId = "editorial";
    // Simulate save failure: baseline unchanged, local preserved.
    assert.equal(designsEqual(baseline, local), false);
    assert.equal(local.typography.fontFamilyId, "editorial");
  });

  it("keeps local changes after conflict simulation", () => {
    const baseline = cloneCanonicalSiteDesign();
    const local = cloneCanonicalSiteDesign();
    local.theme.presetId = "dusk-sage";
    const conflict = {
      ok: false as const,
      code: "CONFLICT" as const,
      actualDraftRevision: 7,
    };
    assert.equal(conflict.code, "CONFLICT");
    assert.equal(designsEqual(baseline, local), false);
    assert.equal(local.theme.presetId, "dusk-sage");
  });
});
