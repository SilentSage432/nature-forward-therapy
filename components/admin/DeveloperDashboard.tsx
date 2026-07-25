"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Database,
  Download,
  ExternalLink,
  RefreshCw,
  Server,
  Shield,
  Users,
} from "lucide-react";
import type {
  ActivityItem,
  ExternalLinkCheck,
} from "@/lib/admin-ops";
import type { SystemHealth } from "@/lib/system-health";

type DeveloperDashboardProps = {
  health: SystemHealth;
  activity: ActivityItem[];
  externalLinks: ExternalLinkCheck[];
};

function statusColor(status: string): string {
  if (status === "Operational" || status === "Active") return "text-emerald-300";
  if (status === "Degraded") return "text-amber-300";
  return "text-red-300";
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-sage-dark/20 bg-forest/50 px-3 py-2">
      <p className="text-xs text-sage-dark">{label}</p>
      <p className="mt-1 font-heading text-sm font-semibold text-body-text">
        {value}
      </p>
    </div>
  );
}

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

export function DeveloperDashboard({
  health,
  activity,
  externalLinks,
}: DeveloperDashboardProps) {
  const [revalidateMessage, setRevalidateMessage] = useState<string | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [exportPending, setExportPending] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  async function revalidateCache() {
    setPending(true);
    setRevalidateMessage(null);
    try {
      const res = await fetch("/api/admin/revalidate", { method: "POST" });
      const body = (await res.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;
      if (!res.ok) {
        setRevalidateMessage(body?.error ?? "Revalidation failed.");
      } else {
        setRevalidateMessage(body?.message ?? "Public cache revalidated.");
      }
    } catch {
      setRevalidateMessage("Revalidation request failed.");
    } finally {
      setPending(false);
    }
  }

  async function exportBackup() {
    setExportPending(true);
    setExportMessage(null);
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setExportMessage(body?.error ?? "Export failed.");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(disposition);
      const filename = match?.[1] ?? "nature-forward-backup.json";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      setExportMessage("Backup downloaded.");
    } catch {
      setExportMessage("Network error while exporting.");
    } finally {
      setExportPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
          <Activity className="h-3.5 w-3.5" />
          System Health Monitor
        </p>
        <h1 className="font-heading text-3xl font-bold text-white">
          Developer Control Plane
        </h1>
        <p className="mt-2 text-sage-light">
          Live infrastructure, content telemetry, and access controls for
          Nature-Forward Therapy.
        </p>
      </div>

      <article className="rounded-2xl border border-gold/35 bg-gradient-to-br from-forest-soft/90 to-forest/80 p-6 shadow-[0_0_28px_rgba(212,175,55,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold text-gold">
              📥 Export Data Backup (JSON)
            </h2>
            <p className="mt-2 max-w-xl text-sm text-sage-light">
              Download a full CMS snapshot — profiles, essays, bookshelf,
              announcements, support thread, and user metadata (no password
              hashes).
            </p>
          </div>
          <button
            type="button"
            onClick={() => void exportBackup()}
            disabled={exportPending}
            className="btn-gold inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-5 py-3 font-heading text-sm font-semibold text-forest disabled:opacity-60"
          >
            <Download
              className={`h-4 w-4 ${exportPending ? "animate-pulse" : ""}`}
            />
            {exportPending ? "Preparing…" : "Export Backup"}
          </button>
        </div>
        {exportMessage ? (
          <p className="mt-3 text-sm text-gold">{exportMessage}</p>
        ) : null}
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-dark/40 text-gold">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-white">
                  Activity Feed / Recent Changes
                </h2>
                <p className="text-xs text-sage-light">
                  Latest record updates across the CMS
                </p>
              </div>
            </div>
            <Link
              href="/admin/activity"
              className="text-xs text-gold hover:underline"
            >
              Full log →
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-sage-dark">No recent changes yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.slice(0, 6).map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-sage-dark/20 bg-forest/40 px-3 py-2"
                >
                  <p className="text-[10px] font-semibold tracking-wide text-gold uppercase">
                    {item.entity}
                  </p>
                  <p className="mt-0.5 text-sm text-sage-light">{item.summary}</p>
                  <p className="mt-1 text-[10px] text-sage-dark">
                    {formatWhen(item.at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-dark/40 text-gold">
              <ExternalLink className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-white">
                External Links Status
              </h2>
              <p className="text-xs text-sage-light">
                Headway &amp; practice webmail connectivity
              </p>
            </div>
          </div>
          <ul className="space-y-3">
            {externalLinks.map((link) => (
              <li
                key={link.id}
                className="rounded-lg border border-sage-dark/20 bg-forest/40 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-semibold text-body-text">
                      {link.label}
                    </p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block truncate text-xs text-sage-dark hover:text-gold"
                    >
                      {link.url}
                    </a>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                      link.ok
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-red-400/15 text-red-300"
                    }`}
                  >
                    {link.ok ? "Reachable" : "Down"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-sage-dark">
                  {link.statusCode !== null
                    ? `HTTP ${link.statusCode}`
                    : link.error ?? "No response"}
                  {link.latencyMs !== null ? ` · ${link.latencyMs} ms` : ""}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-dark/40 text-gold">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-white">
                Database Health
              </h2>
              <p className="text-xs text-sage-light">{health.database.provider}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Status" value={health.database.status} />
            <Metric
              label="Response time"
              value={
                health.database.responseTimeMs === null
                  ? "—"
                  : `${health.database.responseTimeMs} ms`
              }
            />
            <Metric label="Prisma mode" value={health.database.connectionMode} />
            <p
              className={`text-sm font-semibold sm:col-span-2 ${statusColor(health.database.status)}`}
            >
              Postgres ping: {health.database.status}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-dark/40 text-gold">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-white">
                Server &amp; Deployment
              </h2>
              <p className="text-xs text-sage-light">{health.server.runtime}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Environment" value={health.server.environment} />
            <Metric label="NODE_ENV" value={health.server.nodeEnv} />
            <Metric label="Active routes" value={health.server.routeCount} />
            <Metric
              label="Public / Admin / API"
              value={`${health.server.publicRoutes} / ${health.server.adminRoutes} / ${health.server.apiRoutes}`}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-dark/40 text-gold">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-white">
                Content Telemetry
              </h2>
              <p className="text-xs text-sage-light">Live Prisma record counts</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Specialties" value={health.content.specialties} />
            <Metric label="Focus tags" value={health.content.focusTags} />
            <Metric label="Insurances" value={health.content.insurances} />
            <Metric
              label="Practice details"
              value={health.content.practiceDetails}
            />
            <Metric label="Profiles" value={health.content.profiles} />
          </div>
        </article>

        <article className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-dark/40 text-gold">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-white">
                Security &amp; Access
              </h2>
              <p className="text-xs text-sage-light">Auth.js credentials + RBAC</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Total users" value={health.security.totalUsers} />
            <Metric label="Developers" value={health.security.developers} />
            <Metric label="Editors" value={health.security.editors} />
            <Metric label="Auth status" value={health.security.authStatus} />
            <p
              className={`text-sm font-semibold sm:col-span-2 ${statusColor(health.security.authStatus)}`}
            >
              Authentication: {health.security.authStatus}
            </p>
          </div>
        </article>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void revalidateCache()}
          disabled={pending}
          className="btn-gold inline-flex items-center gap-2 rounded-lg px-5 py-3 font-heading text-sm font-semibold text-forest disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
          {pending ? "Revalidating…" : "Revalidate Public Cache"}
        </button>
        <Link
          href="/admin/users"
          className="btn-outline inline-flex items-center gap-2 rounded-lg px-5 py-3 font-heading text-sm font-semibold"
        >
          <Users className="h-4 w-4" />
          Manage System Users
        </Link>
        <Link
          href="/admin/backup"
          className="btn-outline inline-flex items-center gap-2 rounded-lg px-5 py-3 font-heading text-sm font-semibold"
        >
          <Download className="h-4 w-4" />
          Site Backups
        </Link>
      </div>
      {revalidateMessage ? (
        <p className="text-sm text-gold">{revalidateMessage}</p>
      ) : null}
    </div>
  );
}
