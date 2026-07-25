"use client";

import { FormEvent, useMemo, useState } from "react";
import { ExternalLink, RefreshCw, Zap } from "lucide-react";
import { Toast } from "@/components/admin/Toast";

export function CacheRevalidationPanel() {
  const [path, setPath] = useState("/articles");
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewStamp, setPreviewStamp] = useState(() => Date.now());

  const previewHref = useMemo(() => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const sep = normalized.includes("?") ? "&" : "?";
    return `${normalized}${sep}nocache=${previewStamp}`;
  }, [path, previewStamp]);

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
        ok?: boolean;
      } | null;
      if (!res.ok) {
        const err = body?.error ?? "Revalidation failed.";
        setError(err);
        setToastTone("error");
        setToast(err);
        return;
      }
      const okMsg = body?.message ?? "Cache revalidated.";
      setMessage(okMsg);
      setToastTone("success");
      setToast(okMsg);
      setPreviewStamp(Date.now());
    } catch {
      const err = "Network error while revalidating.";
      setError(err);
      setToastTone("error");
      setToast(err);
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
          className="btn-gold mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-5 py-3 font-heading text-sm font-semibold text-forest disabled:opacity-60 sm:w-auto"
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
        <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/articles/slug"
            className="min-h-[44px] w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-sm text-body-text outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={pending || path.trim().length === 0}
            className="btn-outline inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-5 py-3 font-heading text-sm font-semibold disabled:opacity-60"
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
          className="btn-outline mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg px-5 py-3 font-heading text-sm font-semibold"
        >
          <ExternalLink className="h-4 w-4" />
          Open Preview (`?nocache=…`)
        </a>
      </div>

      {message ? <p className="text-sm text-gold">{message}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <Toast
        message={toast}
        tone={toastTone}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
