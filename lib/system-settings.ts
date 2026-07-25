import { prisma } from "@/lib/prisma";
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  SETTING_KEYS,
  type MaintenanceState,
} from "@/lib/system-settings-shared";

export {
  DEFAULT_MAINTENANCE_MESSAGE,
  SETTING_KEYS,
  type MaintenanceState,
} from "@/lib/system-settings-shared";

export async function getSystemSetting(key: string): Promise<string | null> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSystemSetting(
  key: string,
  value: string,
): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getMaintenanceMode(): Promise<MaintenanceState> {
  const raw = await getSystemSetting(SETTING_KEYS.MAINTENANCE_MODE);
  if (!raw) {
    return { enabled: false, message: DEFAULT_MAINTENANCE_MESSAGE };
  }
  try {
    const parsed = JSON.parse(raw) as { enabled?: boolean; message?: string };
    return {
      enabled: Boolean(parsed.enabled),
      message:
        typeof parsed.message === "string" && parsed.message.trim()
          ? parsed.message.trim()
          : DEFAULT_MAINTENANCE_MESSAGE,
    };
  } catch {
    return {
      enabled: raw === "true" || raw === "1",
      message: DEFAULT_MAINTENANCE_MESSAGE,
    };
  }
}

export async function setMaintenanceMode(
  enabled: boolean,
  message?: string,
): Promise<MaintenanceState> {
  const next: MaintenanceState = {
    enabled,
    message:
      message?.trim() ||
      (await getMaintenanceMode()).message ||
      DEFAULT_MAINTENANCE_MESSAGE,
  };
  await setSystemSetting(
    SETTING_KEYS.MAINTENANCE_MODE,
    JSON.stringify(next),
  );
  return next;
}

export async function getSessionEpoch(): Promise<number> {
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
