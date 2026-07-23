"use client";

import { useActionState, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { changeOwnPassword } from "@/lib/actions/password";
import type { ActionResult } from "@/lib/actions/profile";
import { Toast } from "@/components/admin/Toast";

const initialState: ActionResult = { ok: false, message: "" };

type ForcePasswordModalProps = {
  open: boolean;
};

export function ForcePasswordModal({ open }: ForcePasswordModalProps) {
  const { update } = useSession();
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => changeOwnPassword(formData),
    initialState,
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!state.ok) return;
    setToast(state.message || "Changes saved successfully! 🌿");
    void update().then(() => {
      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    });
  }, [state.ok, state.message, update]);

  if (!open) return null;

  const fieldClass =
    "w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold";

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-forest/85 px-4 backdrop-blur-sm">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="force-password-title"
          className="w-full max-w-md rounded-2xl border border-gold/30 bg-forest-soft p-6 shadow-2xl"
        >
          <p className="mb-2 text-xs font-semibold tracking-wide text-gold uppercase">
            Security first
          </p>
          <h2
            id="force-password-title"
            className="font-heading text-2xl font-bold text-white"
          >
            Create a new password
          </h2>
          <p className="mt-2 text-sm text-sage-light">
            Please set a personal password before continuing to your practice
            portal. Minimum 8 characters. This step cannot be skipped.
          </p>

          <form
            action={formAction}
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              const form = new FormData(event.currentTarget);
              const password = String(form.get("password") ?? "");
              const confirm = String(form.get("confirmPassword") ?? "");
              if (password.length < 8) {
                event.preventDefault();
                setLocalError("Password must be at least 8 characters.");
                return;
              }
              if (password !== confirm) {
                event.preventDefault();
                setLocalError("Passwords do not match.");
                return;
              }
              setLocalError(null);
            }}
          >
            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-sage-light">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={fieldClass}
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm text-sage-light"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={fieldClass}
              />
            </div>

            {localError || (!state.ok && state.message) ? (
              <p className="text-sm text-red-300">{localError ?? state.message}</p>
            ) : null}

            <button
              type="submit"
              disabled={pending || state.ok}
              className="btn-gold w-full rounded-lg px-6 py-3 font-heading font-semibold text-forest disabled:opacity-60"
            >
              {pending ? "Updating…" : "Save password & continue"}
            </button>
          </form>
        </div>
      </div>
      <Toast message={toast} tone="success" onDismiss={() => setToast(null)} />
    </>
  );
}
