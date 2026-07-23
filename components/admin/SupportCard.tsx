"use client";

import { FormEvent, useState, useTransition } from "react";
import { Wrench } from "lucide-react";
import { submitSupportRequest } from "@/lib/actions/support";
import { Toast } from "@/components/admin/Toast";

const SUPPORT_INBOX = "dev@flockoffox.org";

export function SupportCard() {
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error">("success");
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await submitSupportRequest(formData);
      setTone(result.ok ? "success" : "error");
      setToast(result.message);
      if (result.ok) {
        setMessage("");
      }
    });
  }

  return (
    <>
      <div className="rounded-2xl border border-gold/30 bg-forest-soft/80 p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold">
            <Wrench className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold text-gold">
              Contact Developer &amp; Support 🛠️
            </h2>
            <p className="mt-1 text-sm text-sage-light">
              Need a design tweak, new section, or technical help? Send a note
              to the Flock of Fox developer team (
              <a
                href={`mailto:${SUPPORT_INBOX}`}
                className="text-gold underline-offset-2 hover:underline"
              >
                {SUPPORT_INBOX}
              </a>
              ).
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="sr-only">Support message</span>
            <textarea
              name="message"
              required
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Need a design tweak, new section, or technical help?"
              className="w-full rounded-xl border border-sage-dark/40 bg-forest/70 px-4 py-3 text-sm text-sage-light placeholder:text-sage-dark/80 focus:border-gold/50 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={pending || message.trim().length === 0}
            className="btn-gold inline-flex items-center justify-center rounded-lg px-5 py-2.5 font-heading text-sm font-semibold text-forest disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send support request"}
          </button>
        </form>
      </div>
      <Toast message={toast} tone={tone} onDismiss={() => setToast(null)} />
    </>
  );
}
