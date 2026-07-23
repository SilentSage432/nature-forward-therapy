"use client";

import { useActionState, useEffect, useState } from "react";
import { updateInsurancesAndPayments } from "@/lib/actions/details";
import type { ActionResult } from "@/lib/actions/profile";
import { INSURANCE_OPTIONS, PAYMENT_OPTIONS } from "@/lib/cms-options";
import { Toast } from "@/components/admin/Toast";

type DetailsFormProps = {
  activeInsurances: string[];
  activePayments: string[];
};

const initialState: ActionResult = { ok: false, message: "" };

export function DetailsForm({
  activeInsurances,
  activePayments,
}: DetailsFormProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) =>
      updateInsurancesAndPayments(formData),
    initialState,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error">("success");

  useEffect(() => {
    if (!state.message) return;
    setTone(state.ok ? "success" : "error");
    setToast(state.message);
  }, [state]);

  return (
    <>
      <form action={formAction} className="space-y-8">
        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-gold">
            Accepted Insurances
          </h2>
          <p className="mb-4 text-sm text-sage-light">
            Toggle the plans currently accepted in your practice.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {INSURANCE_OPTIONS.map((name) => (
              <label
                key={name}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-sage-dark/30 bg-forest/50 px-4 py-3 transition hover:border-clay/40"
              >
                <input
                  type="checkbox"
                  name="insurances"
                  value={name}
                  defaultChecked={activeInsurances.includes(name)}
                  className="mt-1 h-4 w-4 accent-gold"
                />
                <span className="text-sm text-body-text">{name}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-xl font-semibold text-gold">
            Payment Methods
          </h2>
          <p className="mb-4 text-sm text-sage-light">
            Select cards and payment options you accept.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PAYMENT_OPTIONS.map((name) => (
              <label
                key={name}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-sage-dark/30 bg-forest/50 px-4 py-3 transition hover:border-clay/40"
              >
                <input
                  type="checkbox"
                  name="paymentMethods"
                  value={name}
                  defaultChecked={activePayments.includes(name)}
                  className="mt-1 h-4 w-4 accent-gold"
                />
                <span className="text-sm text-body-text">{name}</span>
              </label>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={pending}
          className="btn-gold rounded-lg px-6 py-3 font-heading font-semibold text-forest disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save insurance & payments"}
        </button>
      </form>

      <Toast message={toast} tone={tone} onDismiss={() => setToast(null)} />
    </>
  );
}
