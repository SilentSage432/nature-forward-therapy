export const SETTING_KEYS = {
  MAINTENANCE_MODE: "MAINTENANCE_MODE",
  DEV_ANNOUNCEMENT: "DEV_ANNOUNCEMENT",
  SESSION_EPOCH: "SESSION_EPOCH",
} as const;

export type MaintenanceState = {
  enabled: boolean;
  message: string;
};

export const DEFAULT_MAINTENANCE_MESSAGE =
  "We are currently updating our scheduling system. Please check back shortly.";
