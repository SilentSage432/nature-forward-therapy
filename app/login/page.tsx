import { redirect } from "next/navigation";
import { LoginPageClient } from "@/components/admin/LoginPageClient";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/admin");
  }

  return (
    <AuthSessionProvider session={null}>
      <LoginPageClient />
    </AuthSessionProvider>
  );
}
