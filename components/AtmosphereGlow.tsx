type AtmosphereGlowProps = {
  variant?: "default" | "warm" | "cool";
};

/**
 * Decorative glow blobs. Colors bind to live --site-* tokens via inline
 * background so palette switches are not defeated by build-time utilities.
 */
export function AtmosphereGlow({ variant = "default" }: AtmosphereGlowProps) {
  const blob =
    "pointer-events-none absolute -z-10 rounded-full blur-3xl transform-gpu will-change-transform opacity-100";

  if (variant === "warm") {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className={`${blob} -top-24 left-1/4 h-72 w-72`}
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-accent) 10%, transparent)",
          }}
        />
        <div
          className={`${blob} right-0 bottom-0 h-80 w-80`}
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-accent-secondary) 10%, transparent)",
          }}
        />
      </div>
    );
  }

  if (variant === "cool") {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className={`${blob} top-10 right-1/4 h-64 w-64`}
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-foreground-supporting) 10%, transparent)",
          }}
        />
        <div
          className={`${blob} bottom-8 left-8 h-72 w-72`}
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--site-accent) 10%, transparent)",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className={`${blob} -top-16 left-[12%] h-64 w-64`}
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--site-accent) 10%, transparent)",
        }}
      />
      <div
        className={`${blob} top-1/3 right-[8%] h-72 w-72`}
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--site-accent-secondary) 10%, transparent)",
        }}
      />
      <div
        className={`${blob} bottom-0 left-1/3 h-56 w-56`}
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--site-foreground-supporting) 10%, transparent)",
        }}
      />
    </div>
  );
}
