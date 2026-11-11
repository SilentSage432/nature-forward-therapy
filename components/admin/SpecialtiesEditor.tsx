"use client";

import { FormEvent, useEffect, useState } from "react";
import { SpecialtyGlyph, SPECIALTY_ICON_OPTIONS } from "@/lib/specialty-icons";

type Specialty = {
  id: string;
  title: string;
  icon: string;
  description: string;
  sortOrder: number;
};

type FocusTag = {
  id: string;
  label: string;
  sortOrder: number;
};

export function SpecialtiesEditor() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [focusTags, setFocusTags] = useState<FocusTag[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetch("/api/cms/specialties")
      .then((res) => res.json())
      .then((data: { specialties: Specialty[]; focusTags: FocusTag[] }) => {
        setSpecialties(data.specialties);
        setFocusTags(data.focusTags);
      })
      .catch(() => setError("Failed to load specialties."));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/cms/specialties", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialties, focusTags }),
    });

    setPending(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Save failed.");
      return;
    }

    const data = (await res.json()) as {
      specialties: Specialty[];
      focusTags: FocusTag[];
    };
    setSpecialties(data.specialties);
    setFocusTags(data.focusTags);
    setMessage("Specialties saved.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-gold">
          Key Focus Tags
        </h2>
        {focusTags.map((tag, index) => (
          <div key={tag.id} className="flex gap-3">
            <input
              value={tag.label}
              onChange={(e) => {
                const next = [...focusTags];
                next[index] = { ...tag, label: e.target.value };
                setFocusTags(next);
              }}
              className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
            />
            <button
              type="button"
              onClick={() => setFocusTags(focusTags.filter((t) => t.id !== tag.id))}
              className="rounded-lg border border-sage-dark/40 px-3 text-sm text-sage-light hover:border-gold"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setFocusTags([
              ...focusTags,
              {
                id: `new-${Date.now()}`,
                label: "New focus",
                sortOrder: focusTags.length,
              },
            ])
          }
          className="btn-outline rounded-lg px-4 py-2 text-sm font-semibold"
        >
          Add focus tag
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-gold">
          Specialty Cards
        </h2>
        <p className="text-sm text-sage-light">
          Icons are chosen from the site vocabulary. Stored CMS values are
          unchanged category keys; the public site renders matching Lucide
          glyphs.
        </p>
        {specialties.map((specialty, index) => {
          const knownOption = SPECIALTY_ICON_OPTIONS.some(
            (option) => option.emoji === specialty.icon,
          );
          return (
            <div
              key={specialty.id}
              className="space-y-3 rounded-xl border border-sage-dark/30 p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={specialty.title}
                  onChange={(e) => {
                    const next = [...specialties];
                    next[index] = { ...specialty, title: e.target.value };
                    setSpecialties(next);
                  }}
                  placeholder="Title"
                  className="rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
                />
                <div>
                  <p className="mb-2 text-xs font-medium tracking-wide text-sage-dark uppercase">
                    Card icon
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTY_ICON_OPTIONS.map((option) => {
                      const active = specialty.icon === option.emoji;
                      const OptionIcon = option.Icon;
                      return (
                        <button
                          key={option.emoji}
                          type="button"
                          onClick={() => {
                            const next = [...specialties];
                            next[index] = {
                              ...specialty,
                              icon: option.emoji,
                            };
                            setSpecialties(next);
                          }}
                          className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                            active
                              ? "border-gold/60 bg-gold/10 text-gold"
                              : "border-sage-dark/40 text-sage-light hover:border-gold/40 hover:text-gold"
                          }`}
                          aria-pressed={active}
                          title={`${option.label} — ${option.description}`}
                        >
                          <OptionIcon
                            className="h-4 w-4"
                            aria-hidden="true"
                            strokeWidth={1.75}
                          />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {!knownOption && specialty.icon ? (
                    <p className="mt-2 flex items-center gap-2 text-xs text-amber-200/90">
                      <span className="inline-flex text-gold" aria-hidden="true">
                        <SpecialtyGlyph
                          icon={specialty.icon}
                          className="h-4 w-4"
                        />
                      </span>
                      Custom stored value preserved: {specialty.icon}
                    </p>
                  ) : null}
                </div>
              </div>
              <textarea
                value={specialty.description}
                onChange={(e) => {
                  const next = [...specialties];
                  next[index] = { ...specialty, description: e.target.value };
                  setSpecialties(next);
                }}
                rows={3}
                className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
              />
              <button
                type="button"
                onClick={() =>
                  setSpecialties(specialties.filter((s) => s.id !== specialty.id))
                }
                className="rounded-lg border border-sage-dark/40 px-3 py-2 text-sm text-sage-light hover:border-gold"
              >
                Remove card
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() =>
            setSpecialties([
              ...specialties,
              {
                id: `new-${Date.now()}`,
                title: "New specialty",
                icon: "🌿",
                description: "",
                sortOrder: specialties.length,
              },
            ])
          }
          className="btn-outline rounded-lg px-4 py-2 text-sm font-semibold"
        >
          Add specialty card
        </button>
      </section>

      {message ? <p className="text-sm text-gold">{message}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="btn-gold rounded-lg px-6 py-3 font-heading font-semibold text-forest disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save specialties"}
      </button>
    </form>
  );
}
