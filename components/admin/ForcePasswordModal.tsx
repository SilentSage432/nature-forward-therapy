"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

/**
 * Admin-route-only password gate.
 * Renders only for authenticated EDITOR users with mustChangePassword.
 */
export function ForcePasswordModal() {
  const { data: session, status, update } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (status === "loading" || status === "unauthenticated") {
    return null;
  }

  if (
    status !== "authenticated" ||
    session?.user?.role !== "EDITOR" ||
    session?.user?.mustChangePassword !== true
  ) {
    return null;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: password,
          confirmPassword,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
      } | null;

      if (!res.ok || !data?.success) {
        setError(
          data?.message ?? "Unable to update password. Please try again.",
        );
        setPending(false);
        return;
      }

      // Persist flag into the JWT immediately, then hard-reload so the
      // server layout no longer mounts this modal (avoids refresh race).
      await update({ mustChangePassword: false });
      window.location.href = "/admin";
    } catch {
      setError("Unable to update password. Please try again.");
      setPending(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 pr-11 text-body-text outline-none focus:border-gold";

  return (
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

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm text-sage-light"
            >
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                disabled={pending}
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 transition-colors hover:text-amber-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm text-sage-light"
            >
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                disabled={pending}
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 transition-colors hover:text-amber-200"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="btn-gold inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-heading font-semibold text-forest disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Updating…
              </>
            ) : (
              "Save password & continue"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
