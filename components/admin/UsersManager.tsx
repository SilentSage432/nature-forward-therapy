"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import {
  resetUserPassword,
  toggleMustChangePassword,
} from "@/lib/actions/password";
import type { ActionResult } from "@/lib/actions/profile";
import { Toast } from "@/components/admin/Toast";

type CmsUser = {
  id: string;
  email: string;
  name: string | null;
  role: "DEVELOPER" | "EDITOR";
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
};

const initialState: ActionResult = { ok: false, message: "" };

export function UsersManager() {
  const [users, setUsers] = useState<CmsUser[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resetUser, setResetUser] = useState<CmsUser | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const [magicPending, setMagicPending] = useState<string | null>(null);
  const [magicUrl, setMagicUrl] = useState<string | null>(null);

  const [resetState, resetAction, resetPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => resetUserPassword(formData),
    initialState,
  );
  const [togglePending, startToggle] = useTransition();

  async function loadUsers() {
    const res = await fetch("/api/cms/users");
    if (!res.ok) {
      setError("Failed to load users.");
      return;
    }
    setUsers((await res.json()) as CmsUser[]);
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    if (!resetState.message) return;
    setToastTone(resetState.ok ? "success" : "error");
    setToast(resetState.message);
    if (resetState.ok) {
      setResetUser(null);
      void loadUsers();
    }
  }, [resetState]);

  async function generateMagicLink(user: CmsUser) {
    setMagicPending(user.id);
    setMagicUrl(null);
    try {
      const res = await fetch("/api/admin/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const body = (await res.json().catch(() => null)) as {
        url?: string;
        message?: string;
        error?: string;
      } | null;
      if (!res.ok || !body?.url) {
        setToastTone("error");
        setToast(body?.error ?? "Could not generate magic link.");
        return;
      }
      setMagicUrl(body.url);
      try {
        await navigator.clipboard.writeText(body.url);
        setToastTone("success");
        setToast("Magic login link copied to clipboard (15 minutes).");
      } catch {
        setToastTone("success");
        setToast("Magic login link generated — copy it from the box below.");
      }
    } catch {
      setToastTone("error");
      setToast("Network error generating magic link.");
    } finally {
      setMagicPending(null);
    }
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/cms/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        name: form.get("name"),
        password: form.get("password"),
        role: form.get("role"),
      }),
    });

    setPending(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not create user.");
      return;
    }

    event.currentTarget.reset();
    setMessage("User created. They must change password on first login.");
    await loadUsers();
  }

  const fieldClass =
    "w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold";

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-gold">
          Registered users
        </h2>
        <div className="overflow-x-auto rounded-xl border border-sage-dark/30">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-forest/80 text-xs tracking-wide text-sage-light uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Must change</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-sage-dark/20 bg-forest/40">
                  <td className="px-4 py-3 text-white">
                    <div className="font-medium">{user.email}</div>
                    {user.name ? (
                      <div className="text-xs text-sage-light">{user.name}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sage-light">{user.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        user.mustChangePassword
                          ? "bg-amber-400/15 text-amber-200"
                          : "bg-emerald-400/15 text-emerald-200"
                      }`}
                    >
                      {user.mustChangePassword ? "Required" : "OK"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sage-light">
                    {new Date(user.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {user.role === "EDITOR" ? (
                        <button
                          type="button"
                          disabled={magicPending === user.id}
                          onClick={() => void generateMagicLink(user)}
                          className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-400/15 disabled:opacity-60"
                        >
                          {magicPending === user.id
                            ? "Generating…"
                            : "🔑 Generate 15-Min Magic Login Link"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={togglePending}
                        onClick={() => {
                          const formData = new FormData();
                          formData.set("userId", user.id);
                          formData.set(
                            "value",
                            user.mustChangePassword ? "false" : "true",
                          );
                          startToggle(async () => {
                            const result = await toggleMustChangePassword(formData);
                            setToastTone(result.ok ? "success" : "error");
                            setToast(result.message);
                            if (result.ok) await loadUsers();
                          });
                        }}
                        className="rounded-lg border border-sage-dark/40 px-3 py-1.5 text-xs text-sage-light hover:border-gold hover:text-gold disabled:opacity-60"
                      >
                        {user.mustChangePassword ? "Clear force" : "Force change"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetUser(user)}
                        className="rounded-lg border border-sage-dark/40 px-3 py-1.5 text-xs text-sage-light hover:border-gold hover:text-gold"
                      >
                        Reset Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {magicUrl ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
          <p className="text-xs font-semibold tracking-wide text-emerald-200 uppercase">
            Magic login link (15 min, single use)
          </p>
          <p className="mt-2 break-all font-mono text-xs text-sage-light">
            {magicUrl}
          </p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(magicUrl);
              setToastTone("success");
              setToast("Copied again.");
            }}
            className="mt-3 rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-400/15"
          >
            Copy link
          </button>
        </div>
      ) : null}

      <form onSubmit={onCreate} className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-gold">
          Create user
        </h2>
        <input name="name" placeholder="Name" className={fieldClass} />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className={fieldClass}
        />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Temporary password (min 8)"
          className={fieldClass}
        />
        <select name="role" defaultValue="EDITOR" className={fieldClass}>
          <option value="EDITOR">EDITOR</option>
          <option value="DEVELOPER">DEVELOPER</option>
        </select>
        {message ? <p className="text-sm text-gold">{message}</p> : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="btn-gold rounded-lg px-6 py-3 font-heading font-semibold text-forest disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create user"}
        </button>
      </form>

      {resetUser ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-forest/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gold/30 bg-forest-soft p-6 shadow-2xl">
            <h3 className="font-heading text-xl font-bold text-white">
              Reset password
            </h3>
            <p className="mt-2 text-sm text-sage-light">
              Set a temporary password and/or force{" "}
              <span className="text-gold">{resetUser.email}</span> to change it
              on next login.
            </p>
            <form action={resetAction} className="mt-5 space-y-4">
              <input type="hidden" name="userId" value={resetUser.id} />
              <div>
                <label className="mb-2 block text-sm text-sage-light">
                  Temporary password (optional)
                </label>
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  placeholder="Leave blank to only force change"
                  className={fieldClass}
                />
              </div>
              <label className="flex items-center gap-3 text-sm text-sage-light">
                <input
                  type="checkbox"
                  name="mustChangePassword"
                  defaultChecked
                  className="h-4 w-4 accent-gold"
                />
                Force password change on next login
              </label>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={resetPending}
                  className="btn-gold rounded-lg px-5 py-3 font-heading text-sm font-semibold text-forest disabled:opacity-60"
                >
                  {resetPending ? "Saving…" : "Apply reset"}
                </button>
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
                  className="rounded-lg border border-sage-dark/40 px-5 py-3 text-sm text-sage-light hover:border-gold hover:text-gold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <Toast message={toast} tone={toastTone} onDismiss={() => setToast(null)} />
    </div>
  );
}
