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
      className="hero-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 pb-16"
      style={heroStyle}
    >
      <AtmosphereGlow variant="warm" />
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="animate-fade-in delay-1">
          <div className="organic-portrait headshot-ring relative mx-auto mb-8 h-40 w-40 overflow-hidden md:h-48 md:w-48">
            <Image
              src={profile.headshotPath}
              alt={displayName}
              width={192}
              height={192}
              priority
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <h1 className="animate-slide-up delay-2 mb-3 font-heading text-4xl font-bold text-white md:text-5xl lg:text-6xl">
          {displayName}
        </h1>
        <p className="animate-slide-up delay-3 mb-2 text-lg text-sage-light md:text-xl">
          Clinical Social Work &amp; Therapy | {profile.location}
        </p>
        <BotanicalLine className="animate-fade-in delay-3 mx-auto my-4 w-32" />
        <p className="editorial-serif animate-slide-up delay-4 mx-auto mb-10 max-w-2xl text-2xl text-parchment/95 md:text-3xl">
          {profile.tagline}
        </p>
        <div className="animate-slide-up delay-4 flex flex-col justify-center gap-4 sm:flex-row">
          <a
            href={profile.headwayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold rounded-lg px-8 py-4 text-center font-heading font-semibold text-forest"
          >
            Book via Headway
          </a>
          <a
            href={profile.psychologyTodayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline rounded-lg px-8 py-4 text-center font-heading font-semibold"
          >
            View Psychology Today Profile
          </a>
        </div>
      </div>
    </section>
  );
}
