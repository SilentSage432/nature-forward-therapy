import Image from "next/image";
import type { CSSProperties } from "react";
import { AtmosphereGlow } from "@/components/AtmosphereGlow";
import { BotanicalLine } from "@/components/BotanicalLine";
import type { SiteContent } from "@/lib/types";

type HeroProps = {
  profile: SiteContent["profile"];
};

export function Hero({ profile }: HeroProps) {
  const displayName = `${profile.name}, ${profile.credentials}`;
  const heroStyle = {
    "--hero-image": `url('${profile.heroBackgroundUrl}')`,
  } as CSSProperties;

  return (
    <section
      id="hero"
      className="hero-bg relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pt-28 pb-14 sm:px-6 sm:pt-24 sm:pb-16 md:pt-28"
      style={heroStyle}
    >
      <AtmosphereGlow variant="warm" />
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <div className="animate-fade-in delay-1">
          <div className="organic-portrait headshot-ring relative mx-auto mb-6 h-36 w-36 overflow-hidden sm:mb-8 sm:h-40 sm:w-40 md:h-48 md:w-48">
            <Image
              src={profile.headshotPath}
              alt={displayName}
              width={192}
              height={192}
              priority
              quality={80}
              sizes="(max-width: 640px) 144px, (max-width: 768px) 160px, 192px"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <h1 className="animate-slide-up delay-2 mb-3 font-heading text-[1.85rem] leading-tight font-bold text-white sm:mb-3 sm:text-4xl md:text-5xl lg:text-6xl">
          {displayName}
        </h1>
        <p className="animate-slide-up delay-3 mb-3 max-w-xl text-base leading-relaxed text-sage-light sm:mb-2 sm:text-lg md:text-xl">
          Clinical Social Work &amp; Therapy | {profile.location}
        </p>
        <BotanicalLine className="animate-fade-in delay-3 mx-auto my-3 w-24 sm:my-4 sm:w-32" />
        <p className="editorial-serif animate-slide-up delay-4 mx-auto mb-8 max-w-2xl text-xl leading-snug text-parchment/95 sm:mb-10 sm:text-2xl md:text-3xl">
          {profile.tagline}
        </p>
        <div className="animate-slide-up delay-4 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center sm:gap-4">
          <a
            href={profile.headwayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold w-full rounded-lg px-8 py-4 text-center font-heading font-semibold text-forest sm:w-auto"
          >
            Book via Headway
          </a>
          <a
            href={profile.psychologyTodayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline w-full rounded-lg px-8 py-4 text-center font-heading font-semibold sm:w-auto"
          >
            View Psychology Today Profile
          </a>
        </div>
      </div>
    </section>
  );
}
