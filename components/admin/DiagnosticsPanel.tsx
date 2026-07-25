"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";

type ProbeResult = {
  id: string;
  label: string;
  url: string;
  ok: boolean;
  status: number | null;
  statusCode: number | null;
  latency: number | null;
  latencyMs: number | null;
  error?: string;
};

export function DiagnosticsPanel() {
  const [checks, setChecks] = useState<ProbeResult[]>([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/diagnostics");
      const body = (await res.json().catch(() => null)) as {
        checks?: ProbeResult[];
        checkedAt?: string;
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Diagnostics request failed.");
        setChecks([]);
        return;
      }
      setChecks(body?.checks ?? []);
      setCheckedAt(body?.checkedAt ?? null);
    } catch {
      setError("Network error running diagnostics.");
      setChecks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-sage-light">
          Live HTTP probes for Headway, Psychology Today, and practice webmail
          (5s timeout).
        </p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-sage-dark/40 px-3 py-2 text-xs text-sage-light hover:border-gold hover:text-gold disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Re-run
        </button>
      </div>

      {checkedAt ? (
        <p className="text-xs text-sage-dark">
          Last checked {new Date(checkedAt).toLocaleString()}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {loading && checks.length === 0 ? (
        <p className="text-sm text-sage-dark">Running probes…</p>
      ) : (
        <ul className="space-y-3">
          {checks.map((check) => {
            const status = check.status ?? check.statusCode;
            const latency = check.latency ?? check.latencyMs;
            return (
              <li
                key={check.id}
                className="rounded-xl border border-sage-dark/30 bg-forest/50 px-4 py-3"
              >
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-heading text-sm font-semibold text-white">
                      <Activity className="h-4 w-4 shrink-0 text-gold" />
                      {check.label}
                    </p>
                    <a
                      href={check.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block break-all text-xs text-sage-dark hover:text-gold"
                    >
                      {check.url}
                    </a>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                      check.ok
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-red-400/15 text-red-300"
                    }`}
                  >
                    {check.ok ? "OK" : "Fail"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-sage-light">
                  {status !== null ? `HTTP ${status}` : check.error ?? "No response"}
                  {latency !== null ? ` · ${latency} ms` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
