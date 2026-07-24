"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthLoadingScreen } from "@/components/admin/AuthLoadingScreen";
import { LoginForm } from "@/components/admin/LoginForm";

export function LoginPageClient() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/admin");
    }
  }, [status, router]);

  if (status === "loading") {
    return <AuthLoadingScreen label="Checking your session…" />;
  }

  if (status === "authenticated") {
    return <AuthLoadingScreen label="Taking you to the portal…" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-sage-dark/30 bg-forest-soft/90 p-8 shadow-2xl">
        <h1 className="mb-2 font-heading text-2xl font-bold text-white">
          CMS Sign In
        </h1>
        <p className="mb-8 text-sm text-sage-light">
          Editors manage practice content. Developers manage users and site
          settings.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
