import { LoginForm } from "@/components/admin/LoginForm";

export default function LoginPage() {
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
