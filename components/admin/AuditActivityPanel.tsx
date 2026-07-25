"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { Toast } from "@/components/admin/Toast";

type AuditLog = {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string | null;
  previousState: string | null;
  newState: string | null;
  createdAt: string;
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AuditActivityPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (entity.trim()) params.set("entity", entity.trim());
      params.set("limit", "60");
      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      if (!res.ok) {
        setError("Failed to load audit log.");
        return;
      }
      const data = (await res.json()) as { logs: AuditLog[] };
      setLogs(data.logs ?? []);
    } catch {
      setError("Network error loading audit log.");
    } finally {
      setLoading(false);
    }
  }, [q, entity]);

  useEffect(() => {
    void load();
  }, [load]);

  async function rollback(auditId: string) {
    if (
      !window.confirm(
        "Revert this content to the stored previous snapshot? This writes a new audit entry.",
      )
    ) {
      return;
    }
    setPendingId(auditId);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/audit/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId }),
      });
      const body = (await res.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;
      if (!res.ok) {
        const err = body?.error ?? "Rollback failed.";
        setError(err);
        setToastTone("error");
        setToast(err);
        return;
      }
      const okMsg = body?.message ?? "Rollback complete.";
      setMessage(okMsg);
      setToastTone("success");
      setToast(okMsg);
      void load();
    } catch {
      const err = "Network error during rollback.";
      setError(err);
      setToastTone("error");
      setToast(err);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-sage-dark" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search action, email, entity…"
            className="w-full rounded-lg border border-sage-dark/40 bg-forest py-2.5 pr-3 pl-9 text-sm text-body-text outline-none focus:border-gold"
          />
        </label>
        <input
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          placeholder="Filter entity (BlogPost…)"
          className="rounded-lg border border-sage-dark/40 bg-forest px-3 py-2.5 text-sm text-body-text outline-none focus:border-gold sm:w-48"
        />
        <button
          type="submit"
          className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm font-medium text-gold hover:bg-gold/20"
        >
          Filter
        </button>
      </form>

      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-sage-dark">Loading audit feed…</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-sage-dark">
          No audit entries yet. CMS edits will appear here automatically.
        </p>
      ) : (
        <ul className="divide-y divide-sage-dark/25">
          {logs.map((log) => {
            const canRevert = Boolean(log.previousState) && log.action !== "ROLLBACK";
            return (
              <li
                key={log.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-wide text-gold uppercase">
                    {log.action} · {log.entity}
                  </p>
                  <p className="mt-1 text-sm text-sage-light">
                    {log.userEmail}
                    {log.entityId ? (
                      <span className="text-sage-dark"> · {log.entityId}</span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-sage-dark">
                    {formatWhen(log.createdAt)}
                  </p>
                </div>
                {canRevert ? (
                  <button
                    type="button"
                    disabled={pendingId === log.id}
                    onClick={() => void rollback(log.id)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-amber-400/35 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-400/15 disabled:opacity-60"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {pendingId === log.id
                      ? "Reverting…"
                      : "⏪ Revert to This Snapshot"}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <Toast
        message={toast}
        tone={toastTone}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
