"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ProcessStep } from "@/lib/types";

type PracticeState = {
  id: string;
  expertise: string[];
  paymentMethods: string[];
  insurances: string[];
  therapyTypes: string[];
  processSteps: ProcessStep[];
};

function ListEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-xl font-semibold text-gold">{label}</h2>
      <textarea
        value={values.join("\n")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          )
        }
        rows={8}
        className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
        placeholder="One item per line"
      />
    </section>
  );
}

export function PracticeEditor() {
  const [practice, setPractice] = useState<PracticeState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetch("/api/cms/practice")
      .then((res) => res.json())
      .then((data: PracticeState) => setPractice(data))
      .catch(() => setError("Failed to load practice details."));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!practice) return;
    setPending(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/cms/practice", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(practice),
    });

    setPending(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Save failed.");
      return;
    }

    setPractice((await res.json()) as PracticeState);
    setMessage("Practice details saved.");
  }

  if (!practice) {
    return <p className="text-sage-light">{error ?? "Loading practice details…"}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <ListEditor
        label="Expertise"
        values={practice.expertise}
        onChange={(expertise) => setPractice({ ...practice, expertise })}
      />
      <ListEditor
        label="Payment methods"
        values={practice.paymentMethods}
        onChange={(paymentMethods) => setPractice({ ...practice, paymentMethods })}
      />
      <ListEditor
        label="Insurances"
        values={practice.insurances}
        onChange={(insurances) => setPractice({ ...practice, insurances })}
      />
      <ListEditor
        label="Therapy types"
        values={practice.therapyTypes}
        onChange={(therapyTypes) => setPractice({ ...practice, therapyTypes })}
      />

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-gold">
          The Path (3 steps)
        </h2>
        {practice.processSteps.map((step, index) => (
          <div key={index} className="space-y-2 rounded-xl border border-sage-dark/30 p-4">
            <input
              value={step.title}
              onChange={(e) => {
                const processSteps = [...practice.processSteps];
                processSteps[index] = { ...step, title: e.target.value };
                setPractice({ ...practice, processSteps });
              }}
              className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
            />
            <textarea
              value={step.description}
              onChange={(e) => {
                const processSteps = [...practice.processSteps];
                processSteps[index] = { ...step, description: e.target.value };
                setPractice({ ...practice, processSteps });
              }}
              rows={2}
              className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
            />
          </div>
        ))}
      </section>

      {message ? <p className="text-sm text-gold">{message}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="btn-gold rounded-lg px-6 py-3 font-heading font-semibold text-forest disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save practice details"}
      </button>
    </form>
  );
}
