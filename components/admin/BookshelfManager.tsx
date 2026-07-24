"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import {
  deleteBookshelfItem,
  toggleBookshelfPublished,
} from "@/lib/actions/bookshelf";
import type { BookshelfItem } from "@prisma/client";

type BookshelfManagerProps = {
  items: BookshelfItem[];
};

export function BookshelfManager({ items }: BookshelfManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState(items);

  function onDelete(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteBookshelfItem(id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setRows((prev) => prev.filter((row) => row.id !== id));
      router.refresh();
    });
  }

  function onToggle(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await toggleBookshelfPublished(id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setRows((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, published: !row.published } : row,
        ),
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white">
            Curated Bookshelf
          </h1>
          <p className="mt-2 text-sage-light">
            Books, podcasts, and tools you recommend to clients.
          </p>
        </div>
        <Link
          href="/admin/bookshelf/new"
          className="btn-gold inline-flex items-center justify-center rounded-lg px-5 py-3 font-heading text-sm font-semibold"
        >
          + Add Resource
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sage-dark/40 bg-forest-soft/40 p-10 text-center">
          <p className="text-sage-light">No bookshelf items yet.</p>
          <Link
            href="/admin/bookshelf/new"
            className="mt-4 inline-block text-sm font-medium text-gold hover:underline"
          >
            Add your first recommendation →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-4 rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.published
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-stone-500/20 text-stone-300"
                    }`}
                  >
                    {item.published ? "Published" : "Hidden"}
                  </span>
                  <span className="text-xs text-sage-dark">{item.type}</span>
                  <span className="text-xs text-sage-dark">{item.category}</span>
                </div>
                <h2 className="truncate font-heading text-lg font-semibold text-parchment">
                  {item.title}
                </h2>
                <p className="mt-1 text-sm text-sage-light">{item.author}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/bookshelf/${item.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sage-dark/40 px-3 py-2 text-sm text-sage-light transition hover:border-gold hover:text-gold"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onToggle(item.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sage-dark/40 px-3 py-2 text-sm text-sage-light transition hover:border-gold hover:text-gold disabled:opacity-60"
                >
                  {item.published ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      Publish
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onDelete(item.id, item.title)}
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
