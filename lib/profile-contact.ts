import { z } from "zod";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
export const LOCATION_MAX_LENGTH = 160;

export function normalizeOptionalContactText(
  raw: unknown,
  maxLength: number,
): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) {
    throw new Error(`Value exceeds ${maxLength} characters.`);
  }
  if (CONTROL_CHARS.test(trimmed)) {
    throw new Error("Value contains invalid characters.");
  }
  return trimmed;
}

/** Required practice location — shared by server action and legacy CMS API. */
export function normalizeRequiredLocation(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new Error("Location must be a string.");
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Location is required.");
  }
  if (trimmed.length > LOCATION_MAX_LENGTH) {
    throw new Error(`Location exceeds ${LOCATION_MAX_LENGTH} characters.`);
  }
  if (CONTROL_CHARS.test(trimmed)) {
    throw new Error("Location contains invalid characters.");
  }
  return trimmed;
}

/**
 * Distinguishes absent snapshot keys from explicit null for audit rollback.
 * Absent → omit from Prisma update; null → clear; string → restore.
 */
export function resolveOptionalSnapshotContactField(
  snapshot: Record<string, unknown>,
  key: string,
): { present: false } | { present: true; value: string | null } {
  if (!Object.prototype.hasOwnProperty.call(snapshot, key)) {
    return { present: false };
  }
  const value = snapshot[key];
  if (value === null) {
    return { present: true, value: null };
  }
  return { present: true, value: String(value) };
}

export function normalizeOptionalPublicEmail(raw: unknown): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const parsed = z.string().email().max(254).safeParse(trimmed);
  if (!parsed.success) {
    throw new Error("Invalid email address.");
  }
  return parsed.data;
}

/** Build a tel: href from a human-readable phone string. */
export function toTelHref(phone: string): string {
  const normalized = phone.replace(/[^\d+]/g, "");
  return `tel:${normalized}`;
}

export const optionalPhoneSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    try {
      return normalizeOptionalContactText(value, 40);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Invalid phone.",
      });
      return z.NEVER;
    }
  });

export const optionalFaxSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    try {
      return normalizeOptionalContactText(value, 40);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Invalid fax.",
      });
      return z.NEVER;
    }
  });

export const optionalPublicEmailSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    try {
      return normalizeOptionalPublicEmail(value);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Invalid email.",
      });
      return z.NEVER;
    }
  });

export const locationSchema = z
  .union([z.string(), z.null(), z.undefined(), z.unknown()])
  .transform((value, ctx) => {
    try {
      return normalizeRequiredLocation(value);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message:
          error instanceof Error ? error.message : "Invalid location.",
      });
      return z.NEVER;
    }
  });
