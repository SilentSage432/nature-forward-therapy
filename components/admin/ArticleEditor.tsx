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

function isPresetCategory(value: string): boolean {
  return (ARTICLE_CATEGORIES as readonly string[]).includes(value);
}

export function ArticleEditor({ article = null }: ArticleEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article?.slug));
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const initialCategory = article?.category ?? ARTICLE_CATEGORIES[0];
  const [category, setCategory] = useState(initialCategory);
  const [customMode, setCustomMode] = useState(
    Boolean(article?.category && !isPresetCategory(article.category)),
  );
  const [customCategory, setCustomCategory] = useState(
    article?.category && !isPresetCategory(article.category)
      ? article.category
      : "",
  );
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? "");
  const [published, setPublished] = useState(article?.published ?? false);

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function selectPreset(value: string) {
    setCustomMode(false);
    setCustomCategory("");
    setCategory(value);
  }

  function enableCustom() {
    setCustomMode(true);
    setCategory(customCategory.trim() || "");
  }

  function onCustomCategoryChange(value: string) {
    setCustomCategory(value);
    setCategory(value.trim());
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const resolvedCategory = customMode
      ? customCategory.trim()
      : category.trim();

    if (!resolvedCategory) {
      setError(
        customMode
          ? "Please enter a custom category name."
          : "Please choose a category.",
      );
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set("published", published ? "true" : "false");
    formData.set("category", resolvedCategory);
    formData.set("slug", slugify(slug || title));

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
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
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

        <div>
          <p className="mb-2 text-sm font-medium text-gold" id="category-label">
            Category
          </p>
          <div
            role="group"
            aria-labelledby="category-label"
            className="flex flex-wrap gap-2"
          >
            {ARTICLE_CATEGORIES.map((item) => {
              const active = !customMode && category === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectPreset(item)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "border-gold/60 bg-gold/15 text-gold"
                      : "border-sage-dark/40 bg-forest text-sage-light hover:border-gold/40 hover:text-gold"
                  }`}
                >
                  {item}
                </button>
              );
            })}
            <button
              type="button"
              onClick={enableCustom}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                customMode
                  ? "border-gold/60 bg-gold/15 text-gold"
                  : "border-dashed border-sage-dark/50 bg-forest text-sage-light hover:border-gold/40 hover:text-gold"
              }`}
            >
              + Custom Category
            </button>
          </div>
          {customMode ? (
            <input
              id="customCategory"
              type="text"
              value={customCategory}
              onChange={(e) => onCustomCategoryChange(e.target.value)}
              maxLength={80}
              autoFocus
              className="mt-3 w-full rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 text-body-text outline-none focus:border-gold"
              placeholder="Type a custom topic name…"
              aria-label="Custom category name"
            />
          ) : null}
          <input type="hidden" name="category" value={category} />
        </div>

        <div>
          <label
            htmlFor="slug"
            className="mb-2 block text-sm font-medium text-gold"
          >
            Article Web Address (URL)
          </label>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-sage-dark/40 bg-forest px-4 py-3 focus-within:border-gold">
            <span className="shrink-0 text-sm text-sage-dark">
              /articles/
            </span>
            <input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className="min-w-0 flex-1 bg-transparent font-mono text-sm text-body-text outline-none"
              placeholder="your-title"
            />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-sage-light">
            This creates the web link for your article (e.g.
            flockoffox.org/articles/your-title). It auto-generates from your
            title, but you can edit it if desired.
          </p>
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
