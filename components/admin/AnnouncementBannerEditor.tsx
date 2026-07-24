"use client";

import { FormEvent, useState, useTransition } from "react";
import { upsertAnnouncementBanner } from "@/lib/actions/announcements";
import type { AnnouncementBanner } from "@prisma/client";

type AnnouncementBannerEditorProps = {
  banner: AnnouncementBanner | null;
};

export function AnnouncementBannerEditor({
  banner,
}: AnnouncementBannerEditorProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState(
    banner?.text ?? "Now accepting new adult & couple clients for Fall",
  );
  const [link, setLink] = useState(banner?.link ?? "");
  const [linkText, setLinkText] = useState(
    banner?.linkText ?? "Book Intake via Headway",
  );
  const [isActive, setIsActive] = useState(banner?.isActive ?? false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("isActive", isActive ? "true" : "false");

    startTransition(async () => {
      const result = await upsertAnnouncementBanner(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage(result.message);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white">
            Announcement Banner
          </h1>
          <p className="mt-2 text-sage-light">
            Optional site-wide strip above the main navigation.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-sage-dark/40 bg-forest px-4 py-3">
          <span className="text-sm text-sage-light">
            {isActive ? "Banner enabled" : "Banner disabled"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive((value) => !value)}
            className={`relative h-6 w-11 rounded-full transition ${
              isActive ? "bg-gold" : "bg-stone-600"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${
                isActive ? "translate-x-5" : ""
              }`}
            />
          </button>
        </label>
      </div>

      {message ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="space-y-5 rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <div>
          <label
            htmlFor="text"
            className="mb-2 block text-sm font-medium text-gold"
          >
            Banner text
          </label>
          <input
            id="text"
            name="text"
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
            placeholder="Now accepting new adult & couple clients for Fall"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="link"
              className="mb-2 block text-sm font-medium text-gold"
            >
              Optional link URL
            </label>
            <input
              id="link"
              name="link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
              placeholder="https://care.headway.co/..."
            />
          </div>
          <div>
            <label
              htmlFor="linkText"
              className="mb-2 block text-sm font-medium text-gold"
            >
              Optional link button text
            </label>
            <input
              id="linkText"
              name="linkText"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
              placeholder="Book Intake via Headway"
            />
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-200/90 via-gold/90 to-amber-300/90 px-4 py-3 text-sm font-medium text-forest">
          Preview: {text}
          {link ? (
            <>
              {" "}
              <span className="underline">{linkText || "Learn more"}</span>
            </>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="btn-gold rounded-lg px-5 py-3 font-heading text-sm font-semibold disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Banner"}
        </button>
      </div>
    </form>
  );
}
