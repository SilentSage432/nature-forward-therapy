import Image from "next/image";
import { AtmosphereGlow } from "@/components/AtmosphereGlow";
import { BotanicalLine } from "@/components/BotanicalLine";
import { toTelHref } from "@/lib/profile-contact";
import type { SiteContent } from "@/lib/types";

type ContactProps = {
  profile: SiteContent["profile"];
  processSteps: SiteContent["practice"]["processSteps"];
};

export function Contact({ profile, processSteps }: ContactProps) {
  const location = profile.location?.trim() || null;
  const phone = profile.phone?.trim() || null;
  const fax = profile.fax?.trim() || null;
  const publicEmail = profile.publicEmail?.trim() || null;
  const hasContactInfo = Boolean(location || phone || fax || publicEmail);

  return (
    <section
      id="contact"
      className="relative scroll-mt-24 overflow-hidden bg-forest-soft/90 px-6 py-20 md:py-28"
    >
      <AtmosphereGlow variant="warm" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <h2 className="mb-3 text-center font-heading text-3xl font-bold text-white md:text-4xl">
          Take the Next Step
        </h2>
        <p className="editorial-serif mb-6 text-center text-xl text-sage-light md:text-2xl">
          Begin gently, with clarity and care.
        </p>
        <BotanicalLine className="mx-auto mb-14 w-24" />
        <div className="grid items-start gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h3 className="mb-6 font-heading text-xl font-semibold text-gold">
              The Path
            </h3>
            <ol className="space-y-5">
              {processSteps.map((step, index) => (
                <li
                  key={step.title}
                  className="card-hover frosted-leaf-card flex gap-4 border border-sage-dark/40 bg-site-surface-elevated-strong p-4 hover:shadow-[0_0_25px_var(--site-card-glow)]"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-clay/30 bg-gold/20 font-heading font-bold text-gold">
                    {index + 1}
                  </span>
                  <div>
                    <strong className="text-sand">{step.title}</strong>
                    <p className="editorial-serif mt-1 text-base text-sage-light/90">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <div className="organic-frame mb-8 overflow-hidden border border-sage-dark/30 shadow-2xl">
              <Image
                src={profile.contactImageUrl}
                alt="Sagebrush and calm landscape"
                width={800}
                height={320}
                quality={80}
                sizes="(max-width: 768px) 100vw, 480px"
                className="h-56 w-full object-cover"
              />
            </div>

            {hasContactInfo ? (
              <div className="mb-8 space-y-3">
                <h3 className="font-heading text-xl font-semibold text-gold">
                  Contact Information
                </h3>
                <dl className="space-y-2 text-sm text-sage-light sm:text-base">
                  {location ? (
                    <div>
                      <dt className="sr-only">Location</dt>
                      <dd className="text-parchment/95">{location}</dd>
                    </div>
                  ) : null}
                  {phone ? (
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      <dt className="font-semibold text-sand">Phone</dt>
                      <dd>
                        <a
                          href={toTelHref(phone)}
                          className="text-gold transition-colors hover:text-site-accent-soft"
                        >
                          {phone}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                  {fax ? (
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      <dt className="font-semibold text-sand">Fax</dt>
                      <dd className="text-parchment/95">{fax}</dd>
                    </div>
                  ) : null}
                  {publicEmail ? (
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      <dt className="font-semibold text-sand">Email</dt>
                      <dd>
                        <a
                          href={`mailto:${publicEmail}`}
                          className="break-all text-gold transition-colors hover:text-site-accent-soft"
                        >
                          {publicEmail}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null}

            <h3 className="mb-4 font-heading text-xl font-semibold text-gold">
              View Detailed Profiles
            </h3>
            <div className="flex flex-col gap-4">
              <a
                href={profile.psychologyTodayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline rounded-lg px-6 py-4 text-center font-heading font-semibold"
              >
                Psychology Today
              </a>
              <a
                href={profile.headwayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold rounded-lg px-6 py-4 text-center font-heading font-semibold text-forest"
              >
                Headway
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
