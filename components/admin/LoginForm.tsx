"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showForgotNote, setShowForgotNote] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    // Always land on /admin; ForcePasswordModal handles mustChangePassword there.
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm text-sage-light">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm text-sage-light">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
        />
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="btn-gold w-full rounded-lg px-6 py-3 font-heading font-semibold text-forest disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowForgotNote((value) => !value)}
          className="text-xs text-sage-dark/80 transition-colors hover:text-gold"
        >
          Forgot password?
        </button>
        {showForgotNote ? (
          <p className="mt-3 rounded-lg border border-sage-dark/30 bg-forest/60 px-3 py-3 text-xs leading-relaxed text-sage-light">
            Please contact your site administrator (
            <a
              href="mailto:dev@flockoffox.org"
              className="text-gold hover:underline"
            >
              dev@flockoffox.org
            </a>
            ) to issue a secure password reset.
          </p>
        ) : null}
      </div>
    </form>
  );
}
