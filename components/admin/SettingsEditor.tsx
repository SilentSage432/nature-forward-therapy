"use client";

import { FormEvent, useEffect, useState } from "react";

type SiteSettings = {
  id: string;
  siteTitle: string;
  siteDescription: string;
};

export function SettingsEditor() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetch("/api/cms/settings")
      .then((res) => res.json())
      .then((data: SiteSettings) => setSettings(data))
      .catch(() => setError("Failed to load settings."));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setPending(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/cms/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setPending(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Save failed.");
      return;
    }

    setSettings((await res.json()) as SiteSettings);
    setMessage("Settings saved.");
  }

  if (!settings) {
    return <p className="text-sage-light">{error ?? "Loading settings…"}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm text-sage-light">Site title</label>
        <input
          value={settings.siteTitle}
          onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
          className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm text-sage-light">
          Site description
        </label>
        <textarea
          value={settings.siteDescription}
          onChange={(e) =>
            setSettings({ ...settings, siteDescription: e.target.value })
          }
          rows={4}
          className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
        />
      </div>
      {message ? <p className="text-sm text-gold">{message}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="btn-gold rounded-lg px-6 py-3 font-heading font-semibold text-forest disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
