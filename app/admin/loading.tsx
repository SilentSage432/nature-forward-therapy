export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <div className="h-8 w-56 rounded-lg bg-forest-soft/80" />
        <div className="h-4 w-full max-w-md rounded bg-forest-soft/60" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 rounded-2xl border border-sage-dark/20 bg-forest-soft/50" />
        <div className="h-40 rounded-2xl border border-sage-dark/20 bg-forest-soft/50" />
        <div className="h-40 rounded-2xl border border-sage-dark/20 bg-forest-soft/50" />
        <div className="h-40 rounded-2xl border border-sage-dark/20 bg-forest-soft/50" />
      </div>
      <div className="h-64 rounded-2xl border border-sage-dark/20 bg-forest-soft/40" />
    </div>
  );
}
