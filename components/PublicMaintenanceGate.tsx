import {
  DEFAULT_MAINTENANCE_MESSAGE,
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

/**
 * @deprecated Maintenance enforcement moved to proxy.ts so public HTML can be
 * ISR-cached. Kept as a named export alias for older imports.
 */
export async function PublicMaintenanceGate({
  children,
}: {
  children: React.ReactNode;
  pathname?: string;
}) {
  return children;
}

/** @deprecated Prefer MaintenanceHolding — kept for compatibility. */
export { PublicMaintenanceGate as MaintenanceGate };
