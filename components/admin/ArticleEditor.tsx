"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { createArticle, updateArticle } from "@/lib/actions/articles";
import { ARTICLE_CATEGORIES, slugify } from "@/lib/articles";
import type { BlogPost } from "@prisma/client";

type ArticleEditorProps = {
  article?: BlogPost | null;
};

export function ArticleEditor({ article = null }: ArticleEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [category, setCategory] = useState(
    article?.category ?? ARTICLE_CATEGORIES[0],
  );
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? "");
  const [published, setPublished] = useState(article?.published ?? false);

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("published", published ? "true" : "false");

    startTransition(async () => {
      const result = article
        ? await updateArticle(article.id, formData)
        : await createArticle(formData);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      if (!article && result.id) {
        router.push(`/admin/articles/${result.id}`);
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
            href="/admin/articles"
            className="text-sm text-sage-light transition hover:text-gold"
          >
            ← Back to Articles
          </Link>
          <h1 className="mt-2 font-heading text-3xl font-bold text-white">
            {article ? "Edit Essay" : "Write New Essay"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-sage-dark/40 bg-forest px-4 py-3">
            <span className="text-sm text-sage-light">
              {published ? "Publish Live" : "Save as Draft"}
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
            {pending ? "Saving…" : "Save Essay"}
          </button>
        </div>
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
            htmlFor="title"
            className="mb-2 block text-sm font-medium text-gold"
          >
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 font-serif text-2xl text-parchment italic outline-none focus:border-gold"
            placeholder="Essay title"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
              {ARTICLE_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="slug"
              className="mb-2 block text-sm font-medium text-gold"
            >
              Slug
            </label>
            <input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 font-mono text-sm text-body-text outline-none focus:border-gold"
              placeholder="url-friendly-slug"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="coverImage"
            className="mb-2 block text-sm font-medium text-gold"
          >
            Cover image URL
          </label>
          <input
            id="coverImage"
            name="coverImage"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
            placeholder="https://images.unsplash.com/..."
          />
        </div>

        <div>
          <label
            htmlFor="excerpt"
            className="mb-2 block text-sm font-medium text-gold"
          >
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            required
            rows={3}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
            placeholder="A short invitation into the essay…"
          />
        </div>

        <div>
          <label
            htmlFor="content"
            className="mb-2 block text-sm font-medium text-gold"
          >
            Content
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={18}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 font-serif text-lg leading-relaxed text-parchment outline-none focus:border-gold"
            placeholder="Write freely. Separate paragraphs with a blank line. Use ## for section headings."
          />
        </div>
      </div>
    </form>
  );
}
