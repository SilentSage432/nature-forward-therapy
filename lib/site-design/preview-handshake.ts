/**
 * Parent-side Studio preview readiness lifecycle.
 *
 * READY carries a per-document id so late iframe `load` events can clear
 * readiness without permanently freezing updates, while a newer document's
 * READY retires the previous id (stale READY cannot re-arm an old document).
 */

export const STUDIO_PREVIEW_DOCUMENT_ID_MAX_LEN = 64;
export const STUDIO_PREVIEW_RETIRED_DOCUMENT_ID_LIMIT = 8;

export type PreviewHandshakeState = {
  /** Currently armed document; null after load invalidation. */
  readyDocumentId: string | null;
  /**
   * Last document that successfully READYed. Survives invalidate so a newer
   * document can retire it even after a load cleared readiness.
   */
  lastDocumentId: string | null;
  retiredDocumentIds: readonly string[];
};

export function createPreviewHandshakeState(): PreviewHandshakeState {
  return {
    readyDocumentId: null,
    lastDocumentId: null,
    retiredDocumentIds: [],
  };
}

/** True when the parent may post SET_DESIGN to the iframe. */
export function isPreviewHandshakeReady(state: PreviewHandshakeState): boolean {
  return state.readyDocumentId != null;
}

/**
 * Iframe `load` (including late resource load) invalidates readiness.
 * Does not retire the current document id — the same document may re-READY.
 */
export function invalidatePreviewHandshake(
  state: PreviewHandshakeState,
): PreviewHandshakeState {
  return {
    readyDocumentId: null,
    lastDocumentId: state.readyDocumentId ?? state.lastDocumentId,
    retiredDocumentIds: state.retiredDocumentIds,
  };
}

export type AcceptPreviewReadyResult =
  | { ok: true; state: PreviewHandshakeState; changed: boolean }
  | {
      ok: false;
      reason: "invalid-id" | "retired";
      state: PreviewHandshakeState;
    };

/**
 * Accept a READY document id after transport checks already passed.
 * Re-READY for the active/last id is allowed after invalidate.
 * A new id retires the previous document.
 */
export function acceptPreviewReady(
  state: PreviewHandshakeState,
  documentId: string,
): AcceptPreviewReadyResult {
  if (!isStudioPreviewDocumentId(documentId)) {
    return { ok: false, reason: "invalid-id", state };
  }

  if (state.retiredDocumentIds.includes(documentId)) {
    return { ok: false, reason: "retired", state };
  }

  if (state.readyDocumentId === documentId) {
    return { ok: true, state, changed: false };
  }

  const previousDocumentId = state.readyDocumentId ?? state.lastDocumentId;
  const retiredDocumentIds =
    previousDocumentId && previousDocumentId !== documentId
      ? retireDocumentId(state.retiredDocumentIds, previousDocumentId)
      : state.retiredDocumentIds;

  return {
    ok: true,
    changed: true,
    state: {
      readyDocumentId: documentId,
      lastDocumentId: documentId,
      retiredDocumentIds,
    },
  };
}

function retireDocumentId(
  retired: readonly string[],
  previousReadyId: string,
): readonly string[] {
  if (retired.includes(previousReadyId)) return retired;
  const next = [...retired, previousReadyId];
  if (next.length <= STUDIO_PREVIEW_RETIRED_DOCUMENT_ID_LIMIT) return next;
  return next.slice(next.length - STUDIO_PREVIEW_RETIRED_DOCUMENT_ID_LIMIT);
}

/** Strict document id used in READY envelopes (not a design field). */
export function isStudioPreviewDocumentId(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.length < 8 || value.length > STUDIO_PREVIEW_DOCUMENT_ID_MAX_LEN) {
    return false;
  }
  return /^[A-Za-z0-9_-]+$/.test(value);
}

/** Cryptographically strong id when available; otherwise time+random fallback. */
export function createStudioPreviewDocumentId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID().replace(/-/g, "");
  }
  return `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
