"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfile, type ActionResult } from "@/lib/actions/profile";
import { Toast } from "@/components/admin/Toast";

type ProfileFormProps = {
  initial: {
    name: string;
    credentials: string;
    tagline: string;
    bio: string;
    headwayUrl: string;
    psychologyTodayUrl: string;
  };
};

const initialState: ActionResult = { ok: false, message: "" };

export function ProfileForm({ initial }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => updateProfile(formData),
    initialState,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error">("success");

  useEffect(() => {
    if (!state.message) return;
    setTone(state.ok ? "success" : "error");
    setToast(state.message);
  }, [state]);

  const fieldClass =
    "w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold";

  return (
    <>
      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm text-sage-light">
            Practitioner Name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={initial.name}
            className={fieldClass}
          />
        </div>

        <div>
          <label
            htmlFor="credentials"
            className="mb-2 block text-sm text-sage-light"
          >
            Credentials
          </label>
          <input
            id="credentials"
            name="credentials"
            required
            defaultValue={initial.credentials}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="tagline" className="mb-2 block text-sm text-sage-light">
            Tagline
          </label>
          <textarea
            id="tagline"
            name="tagline"
            required
            rows={3}
            defaultValue={initial.tagline}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="bio" className="mb-2 block text-sm text-sage-light">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            required
            rows={6}
            defaultValue={initial.bio}
            className={fieldClass}
          />
        </div>

        <div>
          <label
            htmlFor="headwayUrl"
            className="mb-2 block text-sm text-sage-light"
          >
            Headway Booking URL
          </label>
          <input
            id="headwayUrl"
            name="headwayUrl"
            type="url"
            required
            defaultValue={initial.headwayUrl}
            className={fieldClass}
          />
        </div>

        <div>
          <label
            htmlFor="psychologyTodayUrl"
            className="mb-2 block text-sm text-sage-light"
          >
            Psychology Today Profile URL
          </label>
          <input
            id="psychologyTodayUrl"
            name="psychologyTodayUrl"
            type="url"
            required
            defaultValue={initial.psychologyTodayUrl}
            className={fieldClass}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="btn-gold rounded-lg px-6 py-3 font-heading font-semibold text-forest disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>

      <Toast message={toast} tone={tone} onDismiss={() => setToast(null)} />
    </>
  );
}
