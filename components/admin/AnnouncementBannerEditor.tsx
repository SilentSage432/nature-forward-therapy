"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { X } from "lucide-react";
import { upsertAnnouncementBanner } from "@/lib/actions/announcements";
import {
  BANNER_THEME_OPTIONS,
  bannerDismissClass,
  bannerLinkClass,
  bannerShellClass,
  bannerTextClass,
  type BannerAlignment,
  type BannerFontStyle,
  type BannerTheme,
} from "@/lib/announcement-banner";
import type { AnnouncementBanner } from "@prisma/client";

type AnnouncementBannerEditorProps = {
  banner: AnnouncementBanner | null;
};

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-sage-dark/40 bg-forest px-4 py-3">
      <span className="text-sm text-sage-light">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-gold" : "bg-stone-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </label>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (next: T) => void;
  options: Array<{ id: T; label: string }>;
  label: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gold">{label}</p>
      <div className="inline-flex rounded-xl border border-sage-dark/40 bg-forest p-1">
        {options.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-gold/20 text-gold"
                  : "text-sage-light hover:text-gold"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BannerPreview({
  text,
  link,
  linkText,
  alignment,
  theme,
  fontStyle,
  isDismissible,
}: {
  text: string;
  link: string;
  linkText: string;
  alignment: BannerAlignment;
  theme: BannerTheme;
  fontStyle: BannerFontStyle;
  isDismissible: boolean;
}) {
  const isSplit = alignment === "left";
  const linkEl = link ? (
    <span className={bannerLinkClass(theme)}>
      {linkText.trim() || "Learn more"}
    </span>
  ) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-sage-dark/40 shadow-lg">
      <p className="border-b border-sage-dark/30 bg-forest px-4 py-2 text-xs font-semibold tracking-wide text-gold uppercase">
        Live preview
      </p>
      <div className={`border-b ${bannerShellClass(theme)}`}>
        <div
          className={`mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 sm:px-6 ${
            isSplit ? "justify-between" : "justify-center"
          }`}
        >
          <p
            className={`min-w-0 text-sm ${bannerTextClass(fontStyle)} ${
              isSplit ? "flex-1 text-left" : "text-center"
            }`}
          >
            <span>{text || "Your announcement text…"}</span>
            {!isSplit && linkEl ? (
              <>
                {" "}
                {linkEl}
              </>
            ) : null}
          </p>
          {isSplit && linkEl ? <div className="shrink-0">{linkEl}</div> : null}
          {isDismissible ? (
            <span
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${bannerDismissClass(theme)}`}
              aria-hidden="true"
            >
              <X className="h-4 w-4" />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

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
  const [isDismissible, setIsDismissible] = useState(
    banner?.isDismissible ?? false,
  );
  const [alignment, setAlignment] = useState<BannerAlignment>(
    (banner?.alignment as BannerAlignment) === "left" ? "left" : "center",
  );
  const [theme, setTheme] = useState<BannerTheme>(
    BANNER_THEME_OPTIONS.some((option) => option.id === banner?.theme)
      ? (banner!.theme as BannerTheme)
      : "amber",
  );
  const [fontStyle, setFontStyle] = useState<BannerFontStyle>(
    banner?.fontStyle === "serif" ? "serif" : "sans",
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("isActive", isActive ? "true" : "false");
    formData.set("isDismissible", isDismissible ? "true" : "false");
    formData.set("alignment", alignment);
    formData.set("theme", theme);
    formData.set("fontStyle", fontStyle);

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
            Optional site-wide strip above the main navigation. Customize look
            and permanence before publishing.
          </p>
        </div>
        <ToggleSwitch
          checked={isActive}
          onChange={setIsActive}
          label={isActive ? "Banner enabled" : "Banner disabled"}
        />
      </div>

      {message ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      ) : null}

      <BannerPreview
        text={text}
        link={link}
        linkText={linkText}
        alignment={alignment}
        theme={theme}
        fontStyle={fontStyle}
        isDismissible={isDismissible}
      />

      <div className="space-y-6 rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
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

        <SegmentedControl
          label="Text alignment"
          value={alignment}
          onChange={setAlignment}
          options={[
            { id: "center", label: "Centered" },
            { id: "left", label: "Left / Right Split" },
          ]}
        />

        <ToggleSwitch
          checked={isDismissible}
          onChange={setIsDismissible}
          label={
            isDismissible
              ? "Allow visitors to close banner (show 'X')"
              : "Banner stays visible (no 'X')"
          }
        />
        <p className="-mt-3 text-xs text-sage-dark">
          Default is permanent—clinic announcements remain until you turn the
          banner off.
        </p>

        <div>
          <p className="mb-2 text-sm font-medium text-gold">Theme palette</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {BANNER_THEME_OPTIONS.map((option) => {
              const active = theme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-gold/60 bg-gold/10"
                      : "border-sage-dark/40 hover:border-gold/35"
                  }`}
                >
                  <span
                    className={`mb-3 block h-8 rounded-lg border border-black/10 ${option.swatchClass}`}
                    aria-hidden="true"
                  />
                  <span className="block text-sm font-semibold text-parchment">
                    {option.emoji} {option.label}
                  </span>
                  <span className="mt-1 block text-xs text-sage-dark">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <SegmentedControl
          label="Typography"
          value={fontStyle}
          onChange={setFontStyle}
          options={[
            { id: "sans", label: "Clean Modern (Sans-Serif)" },
            { id: "serif", label: "Warm Editorial (Serif Italic)" },
          ]}
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="btn-gold rounded-lg px-5 py-3 font-heading text-sm font-semibold disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save Banner"}
          </button>
          <Link
            href="/"
            target="_blank"
            className="text-sm text-sage-light transition hover:text-gold"
          >
            View live site ↗
          </Link>
        </div>
      </div>
    </form>
  );
}
