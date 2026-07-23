import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEditor } from "@/lib/rbac";
import { FALLBACK_CONTENT } from "@/lib/types";

export default async function AdminProfilePage() {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    redirect("/login");
  }

  const profile =
    (await prisma.practitionerProfile.findFirst({
      orderBy: { createdAt: "asc" },
    })) ?? FALLBACK_CONTENT.profile;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white">
          Practice Profile
        </h1>
        <p className="mt-2 text-sage-light">
          Update your public name, credentials, bio, and booking links. Changes
          appear on the live site immediately.
        </p>
      </div>
      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <ProfileForm
          initial={{
            name: profile.name,
            credentials: profile.credentials,
            tagline: profile.tagline,
            bio: profile.bio,
            headwayUrl: profile.headwayUrl,
            psychologyTodayUrl: profile.psychologyTodayUrl,
          }}
        />
      </div>
    </div>
  );
}
