import Image from "next/image";
import { Compass, CreditCard, Pin, Sparkles } from "lucide-react";
import { AtmosphereGlow } from "@/components/AtmosphereGlow";
import { BotanicalLine } from "@/components/BotanicalLine";
import { SpecialtyGlyph } from "@/lib/specialty-icons";
import type { SiteContent } from "@/lib/types";

type SpecialtiesProps = {
  profile: SiteContent["profile"];
  specialties: SiteContent["specialties"];
  focusTags: SiteContent["focusTags"];
  practice: SiteContent["practice"];
};

function splitList<T>(items: T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

const frostedCardClass =
  "card-hover frosted-leaf-card site-border-organic site-surface-elevated-strong border p-8 hover:shadow-[0_0_25px_var(--site-card-glow)]";

export function Specialties({
  profile,
  specialties,
  focusTags,
  practice,
}: SpecialtiesProps) {
  const [expertiseLeft, expertiseRight] = splitList(practice.expertise);
  const [therapyLeft, therapyRight] = splitList(practice.therapyTypes);

  return (
    <section
      id="specialties"
      className="relative scroll-mt-24 overflow-hidden px-6 py-20 md:py-28"
    >
      <AtmosphereGlow />
      <div className="relative z-10 mx-auto max-w-5xl">
        <h2 className="site-fg-heading mb-3 text-center font-heading font-bold">
          Personalized Therapeutic Approaches
        </h2>
        <p className="site-fg-supporting editorial-serif mb-6 text-center">
          Finding calm in the chaos of modern life.
        </p>
        <BotanicalLine className="mx-auto mb-14 w-24" />

        <div className="mb-10">
          <div className={`${frostedCardClass} p-6 md:p-7`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="site-icon-well flex h-12 w-12 items-center justify-center rounded-full"
                  aria-hidden="true"
                >
                  <Sparkles className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="site-fg-heading font-heading text-xl font-bold">
                    Key Focus Areas
                  </h3>
                  <p className="site-fg-supporting editorial-serif mt-1 text-base opacity-90">
                    Specialized support with a steady, grounded approach.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {focusTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="focus-pill inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold transition-colors"
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {specialties.map((specialty) => (
            <article key={specialty.id} className={`${frostedCardClass} text-center`}>
              <div
                className="site-icon-well site-border-secondary mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border"
                aria-hidden="true"
              >
                <SpecialtyGlyph icon={specialty.icon} className="h-7 w-7" />
              </div>
              <h3 className="site-accent mb-3 font-heading text-xl font-bold">
                {specialty.title}
              </h3>
              <p className="site-fg-warm editorial-serif text-lg leading-relaxed opacity-90">
                {specialty.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <article className={frostedCardClass}>
            <div className="mb-5 flex items-center gap-3">
              <div
                className="site-icon-well flex h-12 w-12 items-center justify-center rounded-full"
                aria-hidden="true"
              >
                <Pin className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="site-fg-heading font-heading text-xl font-bold">
                Top Specialties &amp; Expertise
              </h3>
            </div>
            <p className="site-fg-supporting editorial-serif mb-5 text-base opacity-90">
              Additional areas of support frequently addressed in sessions.
            </p>
            <div className="grid gap-x-6 sm:grid-cols-2">
              {[expertiseLeft, expertiseRight].map((column, idx) => (
                <ul key={idx} className="site-fg-warm space-y-2 text-sm opacity-90">
                  {column.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="site-accent-secondary mt-0.5 opacity-90" aria-hidden="true">
                        •
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </article>

          <article className={frostedCardClass}>
            <div className="mb-5 flex items-center gap-3">
              <div
                className="site-icon-well flex h-12 w-12 items-center justify-center rounded-full"
                aria-hidden="true"
              >
                <CreditCard className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="site-fg-heading font-heading text-xl font-bold">
                Payment &amp; Insurance
              </h3>
            </div>
            <div className="flex min-w-0 flex-col gap-8">
              <div className="min-w-0">
                <h4 className="site-accent mb-3 font-heading font-semibold">
                  Payment Methods Accepted
                </h4>
                <ul className="site-fg-warm space-y-2 text-sm leading-relaxed opacity-90">
                  {practice.paymentMethods.map((method) => (
                    <li key={method} className="flex min-w-0 items-start gap-2">
                      <span
                        className="site-accent-secondary mt-0.5 flex-shrink-0 opacity-90"
                        aria-hidden="true"
                      >
                        •
                      </span>
                      <span className="min-w-0 break-words">{method}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="min-w-0">
                <h4 className="site-accent mb-3 font-heading font-semibold">
                  Insurance Accepted
                </h4>
                <ul className="site-fg-warm grid grid-cols-1 gap-x-6 gap-y-2 text-sm leading-relaxed opacity-90 sm:grid-cols-2">
                  {practice.insurances.map((insurance) => (
                    <li key={insurance} className="flex min-w-0 items-start gap-2">
                      <span
                        className="site-accent-secondary mt-0.5 flex-shrink-0 opacity-90"
                        aria-hidden="true"
                      >
                        •
                      </span>
                      <span className="min-w-0 break-words">{insurance}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          <article className={frostedCardClass}>
            <div className="mb-5 flex items-center gap-3">
              <div
                className="site-icon-well flex h-12 w-12 items-center justify-center rounded-full"
                aria-hidden="true"
              >
                <Compass className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="site-fg-heading font-heading text-xl font-bold">
                Treatment Preferences
              </h3>
            </div>
            <h4 className="site-accent mb-3 font-heading font-semibold">
              Types of Therapy
            </h4>
            <div className="grid gap-x-6 sm:grid-cols-2">
              {[therapyLeft, therapyRight].map((column, idx) => (
                <ul key={idx} className="site-fg-warm space-y-2 text-sm opacity-90">
                  {column.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="site-accent-secondary mt-0.5 opacity-90" aria-hidden="true">
                        •
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </article>
        </div>

        <div className="site-border-organic-soft organic-arch mt-14 overflow-hidden border shadow-2xl">
          <Image
            src={profile.specialtiesImageUrl}
            alt="Flowing water – serene nature"
            width={1200}
            height={480}
            quality={80}
            sizes="(max-width: 768px) 100vw, 1024px"
            className="h-72 w-full object-cover md:h-96"
          />
        </div>
      </div>
    </section>
  );
}
