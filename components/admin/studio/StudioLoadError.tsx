import Link from "next/link";
import { StudioShellHeader } from "@/components/admin/studio/StudioShellHeader";

type StudioLoadErrorProps = {
  title?: string;
  message: string;
  code?: string;
  issues?: string[];
};

export function StudioLoadError({
  title = "Overview",
  message,
  code,
  issues,
}: StudioLoadErrorProps) {
  return (
    <div className="space-y-6">
      <StudioShellHeader
        title={title}
        description="Website Studio could not load the current design workspace."
      />
      <section
        role="alert"
        className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-6"
      >
        <h2 className="font-heading text-xl font-semibold text-amber-200">
          Design workspace unavailable
        </h2>
        <p className="mt-2 text-sm text-sage-light">{message}</p>
        {code ? (
          <p className="mt-3 text-xs tracking-wide text-sage-dark uppercase">
            Reference: {code}
          </p>
        ) : null}
        {issues && issues.length > 0 ? (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-sage-light">
            {issues.slice(0, 8).map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/studio"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Try again
          </Link>
          <Link
            href="/admin"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-sage-dark/40 px-4 py-2 text-sm text-sage-light transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Back to admin overview
          </Link>
        </div>
        <p className="mt-4 text-xs text-sage-dark">
          Nothing was published or overwritten. Existing design records remain
          unchanged.
        </p>
      </section>
    </div>
  );
}
