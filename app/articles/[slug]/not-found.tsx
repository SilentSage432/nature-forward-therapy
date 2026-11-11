import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ArticleNotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-3xl text-parchment italic">
        Essay not found
      </h1>
      <p className="mt-3 max-w-md text-sage-light">
        This reflection may have been unpublished or moved.
      </p>
      <Link
        href="/articles"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to Reflections
      </Link>
    </main>
  );
}
