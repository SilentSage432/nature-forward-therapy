"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Database,
  RefreshCw,
  Server,
  Shield,
  Users,
} from "lucide-react";
import type { SystemHealth } from "@/lib/system-health";

type DeveloperDashboardProps = {
  health: SystemHealth;
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
      <p className="mt-1 font-heading text-sm font-semibold text-body-text">{value}</p>
    </div>
  );
}

export function DeveloperDashboard({ health }: DeveloperDashboardProps) {
  const [revalidateMessage, setRevalidateMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function revalidateCache() {
    setPending(true);
    setRevalidateMessage(null);
    try {
      const res = await fetch("/api/admin/revalidate", { method: "POST" });
      const body = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
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
          Live infrastructure, content telemetry, and access controls for Nature-Forward Therapy.
        </p>
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
            <Metric
              label="Status"
              value={health.database.status}
            />
            <Metric
              label="Response time"
              value={
                health.database.responseTimeMs === null
                  ? "—"
                  : `${health.database.responseTimeMs} ms`
              }
            />
            <Metric label="Prisma mode" value={health.database.connectionMode} />
            <p className={`text-sm font-semibold sm:col-span-2 ${statusColor(health.database.status)}`}>
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
            <Metric label="Practice details" value={health.content.practiceDetails} />
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
      </div>
      {revalidateMessage ? (
        <p className="text-sm text-gold">{revalidateMessage}</p>
      ) : null}
    </div>
  );
}
