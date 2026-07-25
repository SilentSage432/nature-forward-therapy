import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getRecentActivity } from "@/lib/admin-ops";
import { isDeveloper } from "@/lib/rbac";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function AdminActivityPage() {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    redirect("/admin");
  }

  const activity = await getRecentActivity(40);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white">
          Activity Log
        </h1>
        <p className="mt-2 text-sage-light">
          Recent CMS and account updates across Nature-Forward Therapy.
        </p>
      </div>

      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        {activity.length === 0 ? (
          <p className="text-sm text-sage-dark">No recent activity recorded.</p>
        ) : (
          <ul className="divide-y divide-sage-dark/25">
            {activity.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs font-semibold tracking-wide text-gold uppercase">
                    {item.entity}
                  </p>
                  <p className="mt-1 text-sm text-sage-light">{item.summary}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-sage-dark">
                  <time dateTime={item.at}>{formatWhen(item.at)}</time>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-gold hover:underline"
                    >
                      Open
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
