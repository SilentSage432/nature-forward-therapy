type AtmosphereGlowProps = {
  variant?: "default" | "warm" | "cool";
};

const glowBlob =
  "pointer-events-none absolute -z-10 rounded-full blur-3xl transform-gpu will-change-transform";

export function AtmosphereGlow({ variant = "default" }: AtmosphereGlowProps) {
  if (variant === "warm") {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className={`${glowBlob} -top-24 left-1/4 h-72 w-72 bg-gold/10`}
        />
        <div
          className={`${glowBlob} right-0 bottom-0 h-80 w-80 bg-clay/10`}
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
          className={`${glowBlob} top-10 right-1/4 h-64 w-64 bg-sage-light/10`}
        />
        <div
          className={`${glowBlob} bottom-8 left-8 h-72 w-72 bg-gold/10`}
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
        className={`${glowBlob} -top-16 left-[12%] h-64 w-64 bg-gold/10`}
      />
      <div
        className={`${glowBlob} top-1/3 right-[8%] h-72 w-72 bg-clay/10`}
      />
      <div
        className={`${glowBlob} bottom-0 left-1/3 h-56 w-56 bg-sage-light/10`}
      />
    </div>
  );
}
