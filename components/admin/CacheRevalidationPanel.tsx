"use client";

import { FormEvent, useMemo, useState } from "react";
import { ExternalLink, RefreshCw, Zap } from "lucide-react";

export function CacheRevalidationPanel() {
  const [path, setPath] = useState("/articles");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewHref = useMemo(() => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const sep = normalized.includes("?") ? "&" : "?";
    return `${normalized}${sep}nocache=${Date.now()}`;
  }, [path]);

  async function revalidate(target?: string) {
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(target ? { path: target } : {}),
      });
      const body = (await res.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Revalidation failed.");
        return;
      }
      setMessage(body?.message ?? "Cache revalidated.");
    } catch {
      setError("Network error while revalidating.");
    } finally {
      setPending(false);
    }
  }

  function onSpecific(event: FormEvent) {
    event.preventDefault();
    const normalized = path.trim().startsWith("/")
      ? path.trim()
      : `/${path.trim()}`;
    void revalidate(normalized);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gold/30 bg-forest/50 p-5">
        <h2 className="font-heading text-lg font-semibold text-gold">
          Global flush
        </h2>
        <p className="mt-2 text-sm text-sage-light">
          Revalidate the primary public routes (`/`, `/articles`, `/bookshelf`)
          and the admin shell.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => void revalidate()}
          className="btn-gold mt-4 inline-flex items-center gap-2 rounded-lg px-5 py-3 font-heading text-sm font-semibold text-forest disabled:opacity-60"
        >
          <Zap className={`h-4 w-4 ${pending ? "animate-pulse" : ""}`} />
          ⚡ Flush Global Route Cache
        </button>
      </div>

      <form
        onSubmit={onSpecific}
        className="rounded-2xl border border-sage-dark/30 bg-forest/50 p-5"
      >
        <h2 className="font-heading text-lg font-semibold text-gold">
          Revalidate specific route
        </h2>
        <p className="mt-2 text-sm text-sage-light">
          Example: `/articles/navigating-transitions` or `/bookshelf`.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/articles/slug"
            className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-sm text-body-text outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={pending || path.trim().length === 0}
            className="btn-outline inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-heading text-sm font-semibold disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
            Revalidate Specific Route
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-sage-dark/30 bg-forest/50 p-5">
        <h2 className="font-heading text-lg font-semibold text-gold">
          Generated preview link
        </h2>
        <p className="mt-2 break-all font-mono text-xs text-sage-light">
          {previewHref}
        </p>
        <a
          href={previewHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline mt-4 inline-flex items-center gap-2 rounded-lg px-5 py-3 font-heading text-sm font-semibold"
        >
          <ExternalLink className="h-4 w-4" />
          Open Preview (`?nocache=…`)
        </a>
      </div>

      {message ? <p className="text-sm text-gold">{message}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
