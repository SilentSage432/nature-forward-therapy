"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteArticle } from "@/lib/actions/articles";
import { formatPublishedDate } from "@/lib/articles";
import type { BlogPost } from "@prisma/client";

type ArticlesManagerProps = {
  articles: BlogPost[];
};

export function ArticlesManager({ articles }: ArticlesManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState(articles);

  function onDelete(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteArticle(id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setRows((prev) => prev.filter((row) => row.id !== id));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white">
            Articles &amp; Essays
          </h1>
          <p className="mt-2 text-sage-light">
            Draft and publish reflections for the public Publication Hub.
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="btn-gold inline-flex items-center justify-center rounded-lg px-5 py-3 font-heading text-sm font-semibold"
        >
          + Write New Essay
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sage-dark/40 bg-forest-soft/40 p-10 text-center">
          <p className="text-sage-light">No essays yet.</p>
          <Link
            href="/admin/articles/new"
            className="mt-4 inline-block text-sm font-medium text-gold hover:underline"
          >
            Write your first essay →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((article) => (
            <li
              key={article.id}
              className="flex flex-col gap-4 rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      article.published
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-stone-500/20 text-stone-300"
                    }`}
                  >
                    {article.published ? "Published" : "Draft"}
                  </span>
                  <span className="text-xs text-sage-dark">{article.category}</span>
                </div>
                <h2 className="truncate font-heading text-lg font-semibold text-parchment">
                  {article.title}
                </h2>
                <p className="mt-1 text-xs text-sage-dark">
                  {article.published && article.publishedAt
                    ? `Published ${formatPublishedDate(article.publishedAt)}`
                    : `Updated ${formatPublishedDate(article.updatedAt)}`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/articles/${article.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sage-dark/40 px-3 py-2 text-sm text-sage-light transition hover:border-gold hover:text-gold"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
                {article.published ? (
                  <Link
                    href={`/articles/${article.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sage-dark/40 px-3 py-2 text-sm text-sage-light transition hover:border-gold hover:text-gold"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Link>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sage-dark/20 px-3 py-2 text-sm text-sage-dark"
                    title="Publish to preview on the public site"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </span>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onDelete(article.id, article.title)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-200 transition hover:border-red-400 hover:bg-red-500/10 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
