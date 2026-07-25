import { unstable_noStore as noStore } from "next/cache";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  SETTING_KEYS,
  type MaintenanceState,
} from "@/lib/system-settings-shared";

export {
  DEFAULT_MAINTENANCE_MESSAGE,
  SETTING_KEYS,
  isMaintenanceExemptPath,
  isPublicContentPath,
  type MaintenanceState,
} from "@/lib/system-settings-shared";

function parseEnabledFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

export async function getSystemSetting(key: string): Promise<string | null> {
  noStore();
  await connection();
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSystemSetting(
  key: string,
  value: string,
): Promise<void> {
  noStore();
  await connection();
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getMaintenanceMode(): Promise<MaintenanceState> {
  // Always bypass Next.js Data Cache / RSC memoization for this control plane flag.
  noStore();
  await connection();

  const raw = await getSystemSetting(SETTING_KEYS.MAINTENANCE_MODE);
  if (!raw) {
    return { enabled: false, message: DEFAULT_MAINTENANCE_MESSAGE };
  }

  try {
    const parsed = JSON.parse(raw) as {
      enabled?: unknown;
      message?: unknown;
    };
    const message =
      typeof parsed.message === "string" && parsed.message.trim()
        ? parsed.message.trim()
        : DEFAULT_MAINTENANCE_MESSAGE;
    return {
      enabled: parseEnabledFlag(parsed.enabled),
      message,
    };
  } catch {
    return {
      enabled: parseEnabledFlag(raw),
      message: DEFAULT_MAINTENANCE_MESSAGE,
    };
  }
}

export async function setMaintenanceMode(
  enabled: boolean,
  message?: string,
): Promise<MaintenanceState> {
  noStore();
  await connection();

  const current = await getMaintenanceMode();
  const next: MaintenanceState = {
    // Preserve explicit false — never coerce via truthiness alone.
    enabled: enabled === true,
    message:
      (typeof message === "string" && message.trim()) ||
      current.message ||
      DEFAULT_MAINTENANCE_MESSAGE,
  };

  await prisma.systemSetting.upsert({
    where: { key: SETTING_KEYS.MAINTENANCE_MODE },
    create: {
      key: SETTING_KEYS.MAINTENANCE_MODE,
      value: JSON.stringify(next),
    },
    update: {
      value: JSON.stringify(next),
    },
  });

  return next;
}

export async function getSessionEpoch(): Promise<number> {
  noStore();
  const raw = await getSystemSetting(SETTING_KEYS.SESSION_EPOCH);
  const n = Number(raw ?? "0");
  return Number.isFinite(n) ? n : 0;
}

let sessionEpochCache: { value: number; at: number } | null = null;

/** Short TTL cache so JWT callbacks don't hit Postgres on every request. */
export async function getSessionEpochCached(): Promise<number> {
  const now = Date.now();
  if (sessionEpochCache && now - sessionEpochCache.at < 5000) {
    return sessionEpochCache.value;
  }
  const value = await getSessionEpoch();
  sessionEpochCache = { value, at: now };
  return value;
}

export async function bumpSessionEpoch(): Promise<number> {
  const next = (await getSessionEpoch()) + 1;
  await setSystemSetting(SETTING_KEYS.SESSION_EPOCH, String(next));
  sessionEpochCache = { value: next, at: Date.now() };
  return next;
}

export async function getDevAnnouncement(): Promise<string> {
  return (await getSystemSetting(SETTING_KEYS.DEV_ANNOUNCEMENT)) ?? "";
}

export async function setDevAnnouncement(value: string): Promise<string> {
  const trimmed = value.trim();
  await setSystemSetting(SETTING_KEYS.DEV_ANNOUNCEMENT, trimmed);
  return trimmed;
}
