import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isEditor } from "@/lib/rbac";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    redirect("/login");
  }

  return <div className="space-y-6">{children}</div>;
}
