"use client";

import { useActionState, useState } from "react";
import { updateProfile, type ActionResult } from "@/lib/actions/profile";
import { Toast } from "@/components/admin/Toast";

type ProfileFormProps = {
  initial: {
    name: string;
    credentials: string;
    tagline: string;
    bio: string;
    location: string;
    phone: string | null;
    fax: string | null;
    publicEmail: string | null;
    headwayUrl: string;
    psychologyTodayUrl: string;
  };
};

const initialState: ActionResult = { ok: false, message: "" };

export function ProfileForm({ initial }: ProfileFormProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error">("success");
  const [, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      const result = await updateProfile(formData);
      setTone(result.ok ? "success" : "error");
      setToast(result.message);
      return result;
    },
    initialState,
  );

  const fieldClass =
    "w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold";

  return (
    <>
      <form action={formAction} className="space-y-8">
        <section className="space-y-5">
          <h2 className="font-heading text-xl font-semibold text-gold">
            Practice Information
          </h2>

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
            <label
              htmlFor="tagline"
              className="mb-2 block text-sm text-sage-light"
            >
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
        </section>

        <section className="space-y-5 border-t border-sage-dark/30 pt-6">
          <div>
            <h2 className="font-heading text-xl font-semibold text-gold">
              Contact Information
            </h2>
            <p className="mt-1 text-sm text-sage-light/80">
              Shown on the public website. Phone, fax, and email are optional.
              Public email is display-only — it does not change mailbox hosting.
            </p>
          </div>

          <div>
            <label
              htmlFor="location"
              className="mb-2 block text-sm text-sage-light"
            >
              Practice Location
            </label>
            <input
              id="location"
              name="location"
              required
              defaultValue={initial.location}
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm text-sage-light"
            >
              Practice Phone{" "}
              <span className="text-sage-dark">(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              maxLength={40}
              defaultValue={initial.phone ?? ""}
              placeholder="e.g. (410) 555-0100"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="fax" className="mb-2 block text-sm text-sage-light">
              Fax Number <span className="text-sage-dark">(optional)</span>
            </label>
            <input
              id="fax"
              name="fax"
              type="text"
              maxLength={40}
              defaultValue={initial.fax ?? ""}
              placeholder="e.g. (410) 555-0199"
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor="publicEmail"
              className="mb-2 block text-sm text-sage-light"
            >
              Public Email <span className="text-sage-dark">(optional)</span>
            </label>
            <input
              id="publicEmail"
              name="publicEmail"
              type="email"
              maxLength={254}
              defaultValue={initial.publicEmail ?? ""}
              placeholder="practice@example.com"
              className={fieldClass}
            />
          </div>
        </section>

        <section className="space-y-5 border-t border-sage-dark/30 pt-6">
          <h2 className="font-heading text-xl font-semibold text-gold">
            Booking Links
          </h2>

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
        </section>

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
