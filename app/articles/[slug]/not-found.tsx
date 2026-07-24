import Link from "next/link";

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
        className="mt-6 text-sm font-medium text-gold hover:underline"
      >
        ← Back to Reflections
      </Link>
    </main>
  );
}
