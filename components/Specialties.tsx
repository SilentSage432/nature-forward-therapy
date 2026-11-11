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
  "card-hover frosted-leaf-card border border-sage-dark/40 bg-site-surface-elevated-strong p-8 hover:shadow-[0_0_25px_var(--site-card-glow)]";

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
      className="relative scroll-mt-24 overflow-hidden bg-forest px-6 py-20 md:py-28"
    >
      <AtmosphereGlow />
      <div className="relative z-10 mx-auto max-w-5xl">
        <h2 className="mb-3 text-center font-heading text-3xl font-bold text-white md:text-4xl">
          Personalized Therapeutic Approaches
        </h2>
        <p className="editorial-serif mb-6 text-center text-xl text-sage-light md:text-2xl">
          Finding calm in the chaos of modern life.
        </p>
        <BotanicalLine className="mx-auto mb-14 w-24" />

        <div className="mb-10">
          <div
            className={`${frostedCardClass} p-6 md:p-7`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-dark/40 text-gold"
                  aria-hidden="true"
                >
                  <Sparkles className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-white">
                    Key Focus Areas
                  </h3>
                  <p className="editorial-serif mt-1 text-base text-sage-light/90">
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
                className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-clay/25 bg-sage-dark/40 text-gold"
                aria-hidden="true"
              >
                <SpecialtyGlyph icon={specialty.icon} className="h-7 w-7" />
              </div>
              <h3 className="mb-3 font-heading text-xl font-bold text-gold">
                {specialty.title}
              </h3>
              <p className="editorial-serif text-lg leading-relaxed text-sand/90">
                {specialty.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <article className={frostedCardClass}>
            <div className="mb-5 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-dark/40 text-gold"
                aria-hidden="true"
              >
                <Pin className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-heading text-xl font-bold text-white">
                Top Specialties &amp; Expertise
              </h3>
            </div>
            <p className="editorial-serif mb-5 text-base text-sage-light/90">
              Additional areas of support frequently addressed in sessions.
            </p>
            <div className="grid gap-x-6 sm:grid-cols-2">
              {[expertiseLeft, expertiseRight].map((column, idx) => (
                <ul key={idx} className="space-y-2 text-sm text-sand/90">
                  {column.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-0.5 text-clay/90" aria-hidden="true">
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
                className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-dark/40 text-gold"
                aria-hidden="true"
              >
                <CreditCard className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-heading text-xl font-bold text-white">
                Payment &amp; Insurance
              </h3>
            </div>
            <div className="flex min-w-0 flex-col gap-8">
              <div className="min-w-0">
                <h4 className="mb-3 font-heading font-semibold text-gold">
                  Payment Methods Accepted
                </h4>
                <ul className="space-y-2 text-sm leading-relaxed text-sand/90">
                  {practice.paymentMethods.map((method) => (
                    <li key={method} className="flex min-w-0 items-start gap-2">
                      <span
                        className="mt-0.5 flex-shrink-0 text-clay/90"
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
                <h4 className="mb-3 font-heading font-semibold text-gold">
                  Insurance Accepted
                </h4>
                <ul className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm leading-relaxed text-sand/90 sm:grid-cols-2">
                  {practice.insurances.map((insurance) => (
                    <li key={insurance} className="flex min-w-0 items-start gap-2">
                      <span
                        className="mt-0.5 flex-shrink-0 text-clay/90"
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
                className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-dark/40 text-gold"
                aria-hidden="true"
              >
                <Compass className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-heading text-xl font-bold text-white">
                Treatment Preferences
              </h3>
            </div>
            <h4 className="mb-3 font-heading font-semibold text-gold">
              Types of Therapy
            </h4>
            <div className="grid gap-x-6 sm:grid-cols-2">
              {[therapyLeft, therapyRight].map((column, idx) => (
                <ul key={idx} className="space-y-2 text-sm text-sand/90">
                  {column.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-0.5 text-clay/90" aria-hidden="true">
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

        <div className="organic-arch mt-14 overflow-hidden border border-sage-dark/30 shadow-2xl">
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
