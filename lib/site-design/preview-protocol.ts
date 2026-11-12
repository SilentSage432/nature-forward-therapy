import type { SiteDesign } from "@/lib/site-design/schema";
import { parseSiteDesign } from "@/lib/site-design/schema";

/** Explicit message channel identity — not a CSS/theme value. */
export const STUDIO_PREVIEW_SOURCE = "nft-studio-preview" as const;

/** Versioned envelope for parent ↔ iframe draft preview messages. */
export const STUDIO_PREVIEW_PROTOCOL_VERSION = 1 as const;

/**
 * SiteDesign JSON is intentionally small. Reject oversized blobs before
 * schema parse to avoid needless work on malformed payloads.
 */
export const STUDIO_PREVIEW_MAX_SERIALIZED_CHARS = 50_000;

export type StudioPreviewReadyMessage = {
  source: typeof STUDIO_PREVIEW_SOURCE;
  protocolVersion: typeof STUDIO_PREVIEW_PROTOCOL_VERSION;
  type: "STUDIO_PREVIEW_READY";
};

export type StudioPreviewSetDesignMessage = {
  source: typeof STUDIO_PREVIEW_SOURCE;
  protocolVersion: typeof STUDIO_PREVIEW_PROTOCOL_VERSION;
  type: "STUDIO_PREVIEW_SET_DESIGN";
  design: SiteDesign;
};

export type StudioPreviewMessage =
  | StudioPreviewReadyMessage
  | StudioPreviewSetDesignMessage;

export type StudioPreviewParseFailure = {
  ok: false;
  reason:
    | "not-object"
    | "source"
    | "protocol-version"
    | "type"
    | "origin"
    | "source-window"
    | "oversized"
    | "invalid-design";
};

export type StudioPreviewParseSuccess = {
  ok: true;
  message: StudioPreviewMessage;
};

export type StudioPreviewParseResult =
  | StudioPreviewParseSuccess
  | StudioPreviewParseFailure;

export type StudioPreviewTransportChecks = {
  /** Exact expected origin (never wildcard). */
  expectedOrigin: string;
  /** MessageEvent.origin */
  actualOrigin: string;
  /** MessageEvent.source */
  eventSource: MessageEventSource | null;
  /**
   * Required sender window.
   * - iframe receives from window.parent
   * - parent receives READY from iframe.contentWindow
   */
  expectedSource: MessageEventSource | null;
};

function isOversized(value: unknown): boolean {
  try {
    return JSON.stringify(value).length > STUDIO_PREVIEW_MAX_SERIALIZED_CHARS;
  } catch {
    return true;
  }
}

/**
 * Strict envelope + SiteDesign V1 validation.
 * Invalid messages must be rejected without applying design changes.
 */
export function parseStudioPreviewMessage(
  value: unknown,
  transport?: StudioPreviewTransportChecks,
): StudioPreviewParseResult {
  if (transport) {
    if (transport.actualOrigin !== transport.expectedOrigin) {
      return { ok: false, reason: "origin" };
    }
    if (
      !transport.expectedSource ||
      !transport.eventSource ||
      transport.eventSource !== transport.expectedSource
    ) {
      return { ok: false, reason: "source-window" };
    }
  }

  if (!value || typeof value !== "object") {
    return { ok: false, reason: "not-object" };
  }

  if (isOversized(value)) {
    return { ok: false, reason: "oversized" };
  }

  const message = value as Record<string, unknown>;

  if (message.source !== STUDIO_PREVIEW_SOURCE) {
    return { ok: false, reason: "source" };
  }

  if (message.protocolVersion !== STUDIO_PREVIEW_PROTOCOL_VERSION) {
    return { ok: false, reason: "protocol-version" };
  }

  if (message.type === "STUDIO_PREVIEW_READY") {
    return {
      ok: true,
      message: {
        source: STUDIO_PREVIEW_SOURCE,
        protocolVersion: STUDIO_PREVIEW_PROTOCOL_VERSION,
        type: "STUDIO_PREVIEW_READY",
      },
    };
  }

  if (message.type === "STUDIO_PREVIEW_SET_DESIGN") {
    const parsed = parseSiteDesign(message.design);
    if (!parsed.ok) {
      return { ok: false, reason: "invalid-design" };
    }
    return {
      ok: true,
      message: {
        source: STUDIO_PREVIEW_SOURCE,
        protocolVersion: STUDIO_PREVIEW_PROTOCOL_VERSION,
        type: "STUDIO_PREVIEW_SET_DESIGN",
        design: parsed.design,
      },
    };
  }

  return { ok: false, reason: "type" };
}

/** Build a READY envelope for the iframe → parent handshake. */
export function createStudioPreviewReadyMessage(): StudioPreviewReadyMessage {
  return {
    source: STUDIO_PREVIEW_SOURCE,
    protocolVersion: STUDIO_PREVIEW_PROTOCOL_VERSION,
    type: "STUDIO_PREVIEW_READY",
  };
}

/** Build a SET_DESIGN envelope. Caller must pass an already-valid SiteDesign. */
export function createStudioPreviewSetDesignMessage(
  design: SiteDesign,
): StudioPreviewSetDesignMessage {
  return {
    source: STUDIO_PREVIEW_SOURCE,
    protocolVersion: STUDIO_PREVIEW_PROTOCOL_VERSION,
    type: "STUDIO_PREVIEW_SET_DESIGN",
    design,
  };
}

/** @deprecated Prefer parseStudioPreviewMessage for transport-aware validation. */
export function isStudioPreviewMessage(
  value: unknown,
): value is StudioPreviewMessage {
  return parseStudioPreviewMessage(value).ok;
}
