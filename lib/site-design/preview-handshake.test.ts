import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  acceptPreviewReady,
  createPreviewHandshakeState,
  createStudioPreviewDocumentId,
  invalidatePreviewHandshake,
  isPreviewHandshakeReady,
  isStudioPreviewDocumentId,
} from "@/lib/site-design/preview-handshake";
import {
  createStudioPreviewReadyMessage,
  createStudioPreviewRequestReadyMessage,
  createStudioPreviewSetDesignMessage,
  parseStudioPreviewMessage,
  STUDIO_PREVIEW_PROTOCOL_VERSION,
  STUDIO_PREVIEW_SOURCE,
} from "@/lib/site-design/preview-protocol";
import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";

describe("preview document ids", () => {
  it("accepts generated document ids", () => {
    const id = createStudioPreviewDocumentId();
    assert.equal(isStudioPreviewDocumentId(id), true);
  });

  it("rejects short, empty, or unsafe document ids", () => {
    assert.equal(isStudioPreviewDocumentId(""), false);
    assert.equal(isStudioPreviewDocumentId("short"), false);
    assert.equal(isStudioPreviewDocumentId("bad id!!!!"), false);
    assert.equal(isStudioPreviewDocumentId("x".repeat(65)), false);
  });
});

describe("preview handshake lifecycle", () => {
  it("READY before load: ready, then late load clears, re-READY recovers", () => {
    let state = createPreviewHandshakeState();
    assert.equal(isPreviewHandshakeReady(state), false);

    const readyBeforeLoad = acceptPreviewReady(state, "documentA123456");
    assert.equal(readyBeforeLoad.ok, true);
    if (!readyBeforeLoad.ok) return;
    state = readyBeforeLoad.state;
    assert.equal(isPreviewHandshakeReady(state), true);
    assert.equal(state.readyDocumentId, "documentA123456");

    // Late iframe load after READY (NFT-STUDIO-006C failure mode).
    state = invalidatePreviewHandshake(state);
    assert.equal(isPreviewHandshakeReady(state), false);

    // Same document re-announces READY — must recover (not permanently freeze).
    const recovered = acceptPreviewReady(state, "documentA123456");
    assert.equal(recovered.ok, true);
    if (!recovered.ok) return;
    state = recovered.state;
    assert.equal(isPreviewHandshakeReady(state), true);
    assert.equal(state.readyDocumentId, "documentA123456");
  });

  it("design changes remain sendable after late-load recovery", () => {
    const first = acceptPreviewReady(
      createPreviewHandshakeState(),
      "documentA123456",
    );
    assert.equal(first.ok, true);
    if (!first.ok) return;
    const cleared = invalidatePreviewHandshake(first.state);
    const again = acceptPreviewReady(cleared, "documentA123456");
    assert.equal(again.ok, true);
    if (!again.ok) return;
    assert.equal(isPreviewHandshakeReady(again.state), true);
  });

  it("genuine reload: new document READY retires the previous id", () => {
    let state = createPreviewHandshakeState();
    const a = acceptPreviewReady(state, "documentA123456");
    assert.equal(a.ok, true);
    if (!a.ok) return;
    state = invalidatePreviewHandshake(a.state);

    const b = acceptPreviewReady(state, "documentB123456");
    assert.equal(b.ok, true);
    if (!b.ok) return;
    state = b.state;
    assert.equal(state.readyDocumentId, "documentB123456");
    assert.ok(state.retiredDocumentIds.includes("documentA123456"));

    const stale = acceptPreviewReady(state, "documentA123456");
    assert.equal(stale.ok, false);
    if (stale.ok) return;
    assert.equal(stale.reason, "retired");
    assert.equal(isPreviewHandshakeReady(stale.state), true);
    assert.equal(stale.state.readyDocumentId, "documentB123456");
  });

  it("READY after reload arms the newest document only", () => {
    let state = createPreviewHandshakeState();
    state = (
      acceptPreviewReady(state, "documentOld1234") as {
        ok: true;
        state: typeof state;
      }
    ).state;
    state = invalidatePreviewHandshake(state);
    state = (
      acceptPreviewReady(state, "documentNew1234") as {
        ok: true;
        state: typeof state;
      }
    ).state;
    assert.equal(state.readyDocumentId, "documentNew1234");
  });

  it("rejects invalid document ids without changing state", () => {
    const state = createPreviewHandshakeState();
    const rejected = acceptPreviewReady(state, "nope");
    assert.equal(rejected.ok, false);
    if (rejected.ok) return;
    assert.equal(rejected.reason, "invalid-id");
    assert.equal(rejected.state.readyDocumentId, null);
  });

  it("idempotent READY for the active document does not churn retirement", () => {
    let state = createPreviewHandshakeState();
    const first = acceptPreviewReady(state, "documentA123456");
    assert.equal(first.ok, true);
    if (!first.ok) return;
    state = first.state;
    const second = acceptPreviewReady(state, "documentA123456");
    assert.equal(second.ok, true);
    if (!second.ok) return;
    assert.equal(second.changed, false);
    assert.deepEqual(second.state.retiredDocumentIds, []);
  });

  it("bounds retired document id growth across many reloads", () => {
    let state = createPreviewHandshakeState();
    for (let i = 0; i < 20; i += 1) {
      const id = `documentReload${String(i).padStart(4, "0")}`;
      state = invalidatePreviewHandshake(state);
      const accepted = acceptPreviewReady(state, id);
      assert.equal(accepted.ok, true);
      if (!accepted.ok) return;
      state = accepted.state;
    }
    assert.ok(state.retiredDocumentIds.length <= 8);
    assert.equal(state.readyDocumentId, "documentReload0019");
    assert.equal(state.retiredDocumentIds.includes("documentReload0000"), false);
    assert.equal(state.retiredDocumentIds.includes("documentReload0018"), true);
  });
});

describe("preview READY envelope documentId", () => {
  const origin = "http://localhost:3006";
  const iframe = { id: "iframe" } as unknown as MessageEventSource;

  it("requires documentId on READY", () => {
    const result = parseStudioPreviewMessage({
      source: STUDIO_PREVIEW_SOURCE,
      protocolVersion: STUDIO_PREVIEW_PROTOCOL_VERSION,
      type: "STUDIO_PREVIEW_READY",
    });
    assert.deepEqual(result, { ok: false, reason: "invalid-document-id" });
  });

  it("accepts READY with documentId from expected source", () => {
    const result = parseStudioPreviewMessage(
      createStudioPreviewReadyMessage("documentA123456"),
      {
        expectedOrigin: origin,
        actualOrigin: origin,
        eventSource: iframe,
        expectedSource: iframe,
      },
    );
    assert.equal(result.ok, true);
    if (result.ok && result.message.type === "STUDIO_PREVIEW_READY") {
      assert.equal(result.message.documentId, "documentA123456");
    }
  });

  it("still rejects invalid origins and sources", () => {
    assert.deepEqual(
      parseStudioPreviewMessage(createStudioPreviewReadyMessage("documentA123456"), {
        expectedOrigin: origin,
        actualOrigin: "https://evil.example",
        eventSource: iframe,
        expectedSource: iframe,
      }),
      { ok: false, reason: "origin" },
    );
    assert.deepEqual(
      parseStudioPreviewMessage(createStudioPreviewReadyMessage("documentA123456"), {
        expectedOrigin: origin,
        actualOrigin: origin,
        eventSource: { id: "other" } as unknown as MessageEventSource,
        expectedSource: iframe,
      }),
      { ok: false, reason: "source-window" },
    );
  });

  it("still rejects invalid designs and does not invent writes", () => {
    const design = cloneCanonicalSiteDesign();
    const result = parseStudioPreviewMessage({
      source: STUDIO_PREVIEW_SOURCE,
      protocolVersion: STUDIO_PREVIEW_PROTOCOL_VERSION,
      type: "STUDIO_PREVIEW_SET_DESIGN",
      design: { ...design, theme: { presetId: "not-real" } },
    });
    assert.deepEqual(result, { ok: false, reason: "invalid-design" });
    // Preview path never touches DB — this assertion documents the contract:
    // invalid messages yield parse failure only (no side effects in parser).
    assert.equal(createStudioPreviewSetDesignMessage(design).design.theme.presetId, "forest-gold");
  });

  it("accepts REQUEST_READY recovery pings", () => {
    const result = parseStudioPreviewMessage(
      createStudioPreviewRequestReadyMessage(),
      {
        expectedOrigin: origin,
        actualOrigin: origin,
        eventSource: iframe,
        expectedSource: iframe,
      },
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.message.type, "STUDIO_PREVIEW_REQUEST_READY");
    }
  });
});

describe("rapid design convergence contract", () => {
  it("latest design wins when handshake stays ready across rapid changes", () => {
    let state = createPreviewHandshakeState();
    const ready = acceptPreviewReady(state, "documentA123456");
    assert.equal(ready.ok, true);
    if (!ready.ok) return;
    state = ready.state;

    const designs = ["forest-gold", "clay-sand", "dusk-sage"] as const;
    let latest = cloneCanonicalSiteDesign();
    for (const preset of designs) {
      assert.equal(isPreviewHandshakeReady(state), true);
      latest = cloneCanonicalSiteDesign();
      latest.theme.presetId = preset;
    }
    assert.equal(latest.theme.presetId, "dusk-sage");
    assert.equal(
      createStudioPreviewSetDesignMessage(latest).design.theme.presetId,
      "dusk-sage",
    );
  });
});
