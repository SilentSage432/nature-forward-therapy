"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";
import {
  createBookshelfItem,
  updateBookshelfItem,
} from "@/lib/actions/bookshelf";
import {
  BOOKSHELF_CATEGORIES,
  BOOKSHELF_TYPES,
} from "@/lib/bookshelf";
import { fileToDataUrl } from "@/lib/image-studio";
import type { BookshelfItem } from "@prisma/client";

type BookshelfEditorProps = {
  item?: BookshelfItem | null;
};

export function BookshelfEditor({ item = null }: BookshelfEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(item?.title ?? "");
  const [author, setAuthor] = useState(item?.author ?? "");
  const [type, setType] = useState(item?.type ?? BOOKSHELF_TYPES[0]);
  const [category, setCategory] = useState(
    item?.category ?? BOOKSHELF_CATEGORIES[0],
  );
  const [externalUrl, setExternalUrl] = useState(item?.externalUrl ?? "");
  const [coverImage, setCoverImage] = useState(item?.coverImage ?? "");
  const [personalNote, setPersonalNote] = useState(item?.personalNote ?? "");
  const [published, setPublished] = useState(item?.published ?? true);

  async function ingestFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    try {
      setCoverImage(await fileToDataUrl(file));
      setError(null);
    } catch {
      setError("Unable to read that image file.");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("published", published ? "true" : "false");
    formData.set("coverImage", coverImage);

    startTransition(async () => {
      const result = item
        ? await updateBookshelfItem(item.id, formData)
        : await createBookshelfItem(formData);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      if (!item && result.id) {
        router.push(`/admin/bookshelf/${result.id}`);
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/bookshelf"
            className="text-sm text-sage-light transition hover:text-gold"
          >
            ← Back to Bookshelf
          </Link>
          <h1 className="mt-2 font-heading text-3xl font-bold text-white">
            {item ? "Edit Resource" : "Add Resource"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-sage-dark/40 bg-forest px-4 py-3">
            <span className="text-sm text-sage-light">
              {published ? "Published" : "Hidden"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={published}
              onClick={() => setPublished((value) => !value)}
              className={`relative h-6 w-11 rounded-full transition ${
                published ? "bg-gold" : "bg-stone-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${
                  published ? "translate-x-5" : ""
                }`}
              />
            </button>
          </label>
          <button
            type="submit"
            disabled={pending}
            className="btn-gold rounded-lg px-5 py-3 font-heading text-sm font-semibold disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save Resource"}
          </button>
        </div>
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

      <div className="space-y-5 rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium text-gold">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
          />
        </div>

        <div>
          <label htmlFor="author" className="mb-2 block text-sm font-medium text-gold">
            Author / Creator
          </label>
          <input
            id="author"
            name="author"
            required
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
            placeholder="Bessel van der Kolk, M.D."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="type" className="mb-2 block text-sm font-medium text-gold">
              Type
            </label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
            >
              {BOOKSHELF_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-medium text-gold"
            >
              Category
            </label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
            >
              {BOOKSHELF_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="externalUrl"
            className="mb-2 block text-sm font-medium text-gold"
          >
            External link
          </label>
          <input
            id="externalUrl"
            name="externalUrl"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
            placeholder="https://bookshop.org/..."
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gold">Cover image</p>
          <input type="hidden" name="coverImage" value={coverImage} />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void ingestFile(file);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-sm text-sage-light transition hover:border-gold hover:text-gold"
            >
              <ImagePlus className="h-4 w-4" />
              Upload cover
            </button>
          </div>
          {coverImage ? (
            <div className="mt-3 max-w-[180px] overflow-hidden rounded-lg border border-stone-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt="" className="aspect-[3/4] w-full object-cover" />
            </div>
          ) : null}
          <input
            value={coverImage.startsWith("data:") ? "" : coverImage}
            onChange={(e) => setCoverImage(e.target.value.trim())}
            className="mt-3 w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
            placeholder="Or paste a cover image URL…"
          />
        </div>

        <div>
          <label
            htmlFor="personalNote"
            className="mb-2 block text-sm font-medium text-gold"
          >
            Nicole&apos;s Note
          </label>
          <textarea
            id="personalNote"
            name="personalNote"
            required
            rows={4}
            value={personalNote}
            onChange={(e) => setPersonalNote(e.target.value)}
            className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 font-serif text-base leading-relaxed text-parchment italic outline-none focus:border-gold"
            placeholder="A short personal recommendation (1–2 sentences)…"
          />
        </div>
      </div>
    </form>
  );
}
