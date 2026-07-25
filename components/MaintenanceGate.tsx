import { auth } from "@/lib/auth";
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  getMaintenanceMode,
} from "@/lib/system-settings";

export async function MaintenanceHolding({
  message,
}: {
  message?: string;
}) {
  const copy = message?.trim() || DEFAULT_MAINTENANCE_MESSAGE;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 20% 20%, rgba(125,155,138,0.35), transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(212,175,55,0.18), transparent 45%), linear-gradient(165deg, #162221, #1e2d2b 55%, #2d3a35)",
        }}
      />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-gold/25 bg-forest-soft/80 p-8 text-center shadow-2xl backdrop-blur-md">
        <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
          Flock of Fox
        </p>
        <h1 className="mt-4 font-heading text-3xl font-bold text-white">
          Nature-Forward Therapy
        </h1>
        <p className="mt-4 text-sage-light">{copy}</p>
        <p className="mt-6 text-xs text-sage-dark">
          Our forest desk will be back with you shortly.
        </p>
      </div>
    </main>
  );
}

export async function PublicMaintenanceGate({
  children,
  pathname,
}: {
  children: React.ReactNode;
  pathname: string;
}) {
  const isExempt =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/maintenance");

  if (isExempt) {
    return children;
  }

  const maintenance = await getMaintenanceMode();
  if (!maintenance.enabled) {
    return children;
  }

  const session = await auth();
  if (session?.user?.role === "DEVELOPER") {
    return (
      <>
        <div className="border-b border-amber-400/40 bg-amber-400/15 px-4 py-2 text-center text-xs font-medium text-amber-100">
          Maintenance mode is ON for public visitors. Developers can still
          browse.
        </div>
        {children}
      </>
    );
  }

  return <MaintenanceHolding message={maintenance.message} />;
}
