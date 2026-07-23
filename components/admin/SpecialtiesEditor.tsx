"use client";

import { FormEvent, useEffect, useState } from "react";

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
        {specialties.map((specialty, index) => (
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
              <input
                value={specialty.icon}
                onChange={(e) => {
                  const next = [...specialties];
                  next[index] = { ...specialty, icon: e.target.value };
                  setSpecialties(next);
                }}
                placeholder="Icon / emoji"
                className="rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
              />
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
        ))}
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
