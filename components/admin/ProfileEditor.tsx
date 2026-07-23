"use client";

import { FormEvent, useEffect, useState } from "react";

type Profile = {
  id: string;
  name: string;
  credentials: string;
  location: string;
  tagline: string;
  bio: string;
  bioHighlight: string;
  headshotPath: string;
  headwayUrl: string;
  psychologyTodayUrl: string;
  heroBackgroundUrl: string;
  aboutImageUrl: string;
  specialtiesImageUrl: string;
  contactImageUrl: string;
  footerCredit: string;
};

const fields: Array<{ key: keyof Profile; label: string; multiline?: boolean }> = [
  { key: "name", label: "Name" },
  { key: "credentials", label: "Credentials" },
  { key: "location", label: "Location" },
  { key: "tagline", label: "Tagline", multiline: true },
  { key: "bio", label: "Bio", multiline: true },
  { key: "bioHighlight", label: "Bio highlight", multiline: true },
  { key: "headshotPath", label: "Headshot path" },
  { key: "headwayUrl", label: "Headway booking URL" },
  { key: "psychologyTodayUrl", label: "Psychology Today URL" },
  { key: "heroBackgroundUrl", label: "Hero background URL" },
  { key: "aboutImageUrl", label: "About image URL" },
  { key: "specialtiesImageUrl", label: "Specialties image URL" },
  { key: "contactImageUrl", label: "Contact image URL" },
];

export function ProfileEditor({ canEditFooter }: { canEditFooter: boolean }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetch("/api/cms/profile")
      .then((res) => res.json())
      .then((data: Profile) => setProfile(data))
      .catch(() => setError("Failed to load profile."));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setPending(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/cms/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    setPending(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Save failed.");
      return;
    }

    const updated = (await res.json()) as Profile;
    setProfile(updated);
    setMessage("Profile saved.");
  }

  if (!profile) {
    return <p className="text-sage-light">{error ?? "Loading profile…"}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="mb-2 block text-sm text-sage-light">{field.label}</label>
          {field.multiline ? (
            <textarea
              value={profile[field.key]}
              onChange={(e) =>
                setProfile({ ...profile, [field.key]: e.target.value })
              }
              rows={4}
              className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
            />
          ) : (
            <input
              value={profile[field.key]}
              onChange={(e) =>
                setProfile({ ...profile, [field.key]: e.target.value })
              }
              className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
            />
          )}
        </div>
      ))}
      {canEditFooter ? (
        <div>
          <label className="mb-2 block text-sm text-sage-light">
            Footer credit (developer)
          </label>
          <input
            value={profile.footerCredit}
            onChange={(e) =>
              setProfile({ ...profile, footerCredit: e.target.value })
            }
            className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
          />
        </div>
      ) : null}
      {message ? <p className="text-sm text-gold">{message}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="btn-gold rounded-lg px-6 py-3 font-heading font-semibold text-forest disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
