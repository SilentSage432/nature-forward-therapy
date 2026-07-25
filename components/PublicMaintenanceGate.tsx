import { unstable_noStore as noStore } from "next/cache";
import { auth } from "@/lib/auth";
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  getMaintenanceMode,
  isMaintenanceExemptPath,
  isPublicContentPath,
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
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 18% 15%, rgba(125,155,138,0.4), transparent 52%), radial-gradient(ellipse at 82% 75%, rgba(212,175,55,0.2), transparent 48%), linear-gradient(165deg, #162221, #1e2d2b 55%, #2d3a35)",
        }}
      />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-gold/25 bg-forest-soft/85 p-8 text-center shadow-2xl backdrop-blur-md">
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

function DeveloperMaintenanceBanner() {
  return (
    <div
      className="border-b border-amber-400/45 bg-amber-400/15 px-4 py-2.5 text-center text-xs font-semibold text-amber-100"
      role="status"
    >
      🚨 Emergency Maintenance Mode is currently ACTIVE on the public site.
    </div>
  );
}

/**
 * Enforces MAINTENANCE_MODE on public content for everyone except DEVELOPER.
 * Editors / anonymous visitors see the holding card on public routes.
 * Developers always bypass and see a site-wide amber warning banner.
 */
export async function PublicMaintenanceGate({
  children,
  pathname,
}: {
  children: React.ReactNode;
  pathname: string;
}) {
  noStore();

  const maintenance = await getMaintenanceMode();
  const session = await auth();
  const isDeveloper = session?.user?.role === "DEVELOPER";

  if (!maintenance.enabled) {
    return children;
  }

  const exempt = isMaintenanceExemptPath(pathname);
  const publicContent = isPublicContentPath(pathname);

  // Authenticated non-developers on unknown paths (missing x-pathname):
  // do not trap them on a holding card — they may be inside /admin.
  const unknownPath = !pathname;
  if (unknownPath && session?.user && !isDeveloper) {
    return children;
  }

  if (isDeveloper) {
    return (
      <>
        <DeveloperMaintenanceBanner />
        {children}
      </>
    );
  }

  // Admin / login / API stay available for EDITORS during maintenance.
  if (exempt) {
    return children;
  }

  // Public content (and anonymous unknown paths) → holding card.
  if (publicContent || (unknownPath && !session?.user)) {
    return <MaintenanceHolding message={maintenance.message} />;
  }

  return children;
}

/** @deprecated Prefer PublicMaintenanceGate — kept for /maintenance page imports. */
export { PublicMaintenanceGate as MaintenanceGate };
