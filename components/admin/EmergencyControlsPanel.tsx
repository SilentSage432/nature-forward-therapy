"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ShieldOff } from "lucide-react";
import { DEFAULT_MAINTENANCE_MESSAGE } from "@/lib/system-settings-shared";

type MaintenanceState = {
  enabled: boolean;
  message: string;
};

export function EmergencyControlsPanel() {
  const router = useRouter();
  const [maintenance, setMaintenance] = useState<MaintenanceState>({
    enabled: false,
    message: DEFAULT_MAINTENANCE_MESSAGE,
  });
  const [pending, setPending] = useState(false);
  const [flushPending, setFlushPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/maintenance", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { maintenance?: MaintenanceState }) => {
        if (data.maintenance) {
          setMaintenance({
            enabled: data.maintenance.enabled === true,
            message:
              data.maintenance.message?.trim() || DEFAULT_MAINTENANCE_MESSAGE,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  async function saveMaintenance(next: MaintenanceState) {
    setPending(true);
    setMessage(null);
    setError(null);

    const payload = {
      enabled: next.enabled === true,
      message: next.message?.trim() || DEFAULT_MAINTENANCE_MESSAGE,
    };

    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => null)) as {
        message?: string;
        error?: string;
        maintenance?: MaintenanceState;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Could not update maintenance mode.");
        return;
      }
      if (body?.maintenance) {
        setMaintenance({
          enabled: body.maintenance.enabled === true,
          message:
            body.maintenance.message?.trim() || DEFAULT_MAINTENANCE_MESSAGE,
        });
      } else {
        setMaintenance(payload);
      }
      setMessage(body?.message ?? "Saved.");
      // Sync root layout / developer banner immediately.
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  async function forceOff() {
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/maintenance?action=off", {
        cache: "no-store",
      });
      const body = (await res.json().catch(() => null)) as {
        message?: string;
        error?: string;
        maintenance?: MaintenanceState;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Could not force maintenance off.");
        return;
      }
      if (body?.maintenance) {
        setMaintenance({
          enabled: false,
          message:
            body.maintenance.message?.trim() || DEFAULT_MAINTENANCE_MESSAGE,
        });
      } else {
        setMaintenance((prev) => ({ ...prev, enabled: false }));
      }
      setMessage(body?.message ?? "Maintenance forced OFF.");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  async function flushSessions() {
    if (
      !window.confirm(
        "Invalidate all active JWT sessions? Everyone (including you) will need to sign in again.",
      )
    ) {
      return;
    }
    setFlushPending(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ flushSessions: true }),
      });
      const body = (await res.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Could not flush sessions.");
        return;
      }
      setMessage(body?.message ?? "Sessions flushed.");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setFlushPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
        <div className="mb-3 flex items-center gap-2 text-amber-200">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="font-heading text-lg font-semibold">
            Emergency Maintenance Mode
          </h2>
        </div>
        <p className="text-sm text-sage-light">
          When enabled, public visitors see a nature-themed holding card.
          Developers can still browse the live site with a banner reminder.
        </p>
        <label className="mt-4 flex items-center gap-3 text-sm text-sage-light">
          <input
            type="checkbox"
            checked={maintenance.enabled === true}
            disabled={pending}
            onChange={(e) => {
              const enabled = e.target.checked === true;
              void saveMaintenance({
                enabled,
                message:
                  maintenance.message.trim() || DEFAULT_MAINTENANCE_MESSAGE,
              });
            }}
            className="h-4 w-4 accent-gold"
          />
          Master switch — maintenance mode{" "}
          {maintenance.enabled ? "ON" : "OFF"}
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-xs tracking-wide text-sage-dark uppercase">
            Public message
          </span>
          <textarea
            rows={3}
            value={maintenance.message}
            onChange={(e) =>
              setMaintenance({ ...maintenance, message: e.target.value })
            }
            className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-sm text-body-text outline-none focus:border-gold"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void saveMaintenance({
                enabled: maintenance.enabled === true,
                message:
                  maintenance.message.trim() || DEFAULT_MAINTENANCE_MESSAGE,
              })
            }
            className="btn-gold rounded-lg px-5 py-2.5 font-heading text-sm font-semibold text-forest disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save maintenance message"}
          </button>
          {maintenance.enabled ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void forceOff()}
              className="rounded-lg border border-amber-300/40 bg-amber-400/10 px-5 py-2.5 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20 disabled:opacity-60"
            >
              Force OFF now
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-red-400/25 bg-red-400/5 p-5">
        <div className="mb-3 flex items-center gap-2 text-red-200">
          <ShieldOff className="h-5 w-5" />
          <h2 className="font-heading text-lg font-semibold">
            Session Reset / Security Flush
          </h2>
        </div>
        <p className="text-sm text-sage-light">
          Bumps the global session epoch so existing JWT cookies stop
          authenticating until users sign in again.
        </p>
        <button
          type="button"
          disabled={flushPending}
          onClick={() => void flushSessions()}
          className="mt-4 rounded-lg border border-red-300/40 bg-red-400/10 px-5 py-2.5 text-sm font-medium text-red-100 transition hover:bg-red-400/20 disabled:opacity-60"
        >
          {flushPending ? "Flushing…" : "Invalidate all active sessions"}
        </button>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {message ? (
        <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}
    </div>
  );
}
