import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";
import { CacheRevalidationPanel } from "@/components/admin/CacheRevalidationPanel";

export default async function AdminCachePage() {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white">
          Cache &amp; Revalidation
        </h1>
        <p className="mt-2 text-sage-light">
          Flush Next.js route caches and open cache-busted preview links.
        </p>
      </div>
      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <CacheRevalidationPanel />
      </div>
    </div>
  );
}
