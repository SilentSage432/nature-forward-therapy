type AtmosphereGlowProps = {
  variant?: "default" | "warm" | "cool";
};

export function AtmosphereGlow({ variant = "default" }: AtmosphereGlowProps) {
  if (variant === "warm") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-clay/10 blur-3xl" />
      </div>
    );
  }

  if (variant === "cool") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-10 right-1/4 h-64 w-64 rounded-full bg-sage-light/10 blur-3xl" />
        <div className="absolute bottom-8 left-8 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-16 left-[12%] h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute top-1/3 right-[8%] h-72 w-72 rounded-full bg-clay/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-sage-light/10 blur-3xl" />
    </div>
  );
}
