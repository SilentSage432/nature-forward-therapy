import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSiteContent } from "@/lib/content";
import { isDeveloper } from "@/lib/rbac";

export default async function AdminSeoPage() {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    redirect("/admin");
  }

  const content = await getSiteContent();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white">
          SEO &amp; Indexing
        </h1>
        <p className="mt-2 text-sage-light">
          Review public metadata and primary indexable surfaces for the live
          site.
        </p>
      </div>

      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <h2 className="font-heading text-lg font-semibold text-gold">
          Current site metadata
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs tracking-wide text-sage-dark uppercase">
              Title
            </dt>
            <dd className="mt-1 text-sage-light">{content.site.siteTitle}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-sage-dark uppercase">
              Description
            </dt>
            <dd className="mt-1 text-sage-light">
              {content.site.siteDescription}
            </dd>
          </div>
        </dl>
        <Link
          href="/admin/settings"
          className="mt-5 inline-block text-sm text-gold hover:underline"
        >
          Edit in System Settings →
        </Link>
      </div>

      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <h2 className="font-heading text-lg font-semibold text-gold">
          Indexable routes
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-sage-light">
          <li>
            <a href="/" className="text-gold hover:underline">
              /
            </a>{" "}
            — practice landing page
          </li>
          <li>
            <a href="/articles" className="text-gold hover:underline">
              /articles
            </a>{" "}
            — publication hub
          </li>
          <li>
            <a href="/bookshelf" className="text-gold hover:underline">
              /bookshelf
            </a>{" "}
            — curated resources
          </li>
        </ul>
        <p className="mt-4 text-xs text-sage-dark">
          Admin routes (`/admin/*`, `/login`) remain auth-gated and should not
          be indexed.
        </p>
      </div>
    </div>
  );
}
