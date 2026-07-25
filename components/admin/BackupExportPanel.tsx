"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function BackupExportPanel() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function exportBackup() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setMessage(body?.error ?? "Export failed.");
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
      setMessage("Backup downloaded.");
    } catch {
      setMessage("Network error while exporting.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-sage-light">
        Download a JSON snapshot of CMS content, essays, bookshelf items,
        support messages, and user metadata (passwords are never included).
      </p>
      <button
        type="button"
        onClick={() => void exportBackup()}
        disabled={pending}
        className="btn-gold inline-flex items-center gap-2 rounded-lg px-5 py-3 font-heading text-sm font-semibold text-forest disabled:opacity-60"
      >
        <Download className={`h-4 w-4 ${pending ? "animate-pulse" : ""}`} />
        {pending ? "Preparing export…" : "📥 Export Data Backup (JSON)"}
      </button>
      {message ? <p className="text-sm text-gold">{message}</p> : null}
    </div>
  );
}
