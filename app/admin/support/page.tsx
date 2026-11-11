import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";
import { SupportDesk } from "@/components/admin/SupportDesk";

export default async function AdminSupportPage() {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-heading text-3xl font-bold text-white">
          <MessageCircle
            className="h-7 w-7 shrink-0 text-gold"
            aria-hidden="true"
            strokeWidth={1.75}
          />
          Client Support Desk
        </h1>
        <p className="mt-2 text-sage-light">
          Active thread with Nicole from the practice portal. Reply here and
          mark topics resolved when done — resolved messages leave the live
          feed.
        </p>
      </div>
      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <SupportDesk />
      </div>
    </div>
  );
}
