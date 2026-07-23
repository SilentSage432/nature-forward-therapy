import Image from "next/image";
import { AtmosphereGlow } from "@/components/AtmosphereGlow";
import { BotanicalLine } from "@/components/BotanicalLine";
import type { SiteContent } from "@/lib/types";

type AboutProps = {
  profile: SiteContent["profile"];
};

export function About({ profile }: AboutProps) {
  return (
    <section
      id="about"
      className="curve-bottom relative scroll-mt-24 overflow-hidden bg-forest-soft/80 px-6 py-20 md:py-28"
    >
      <AtmosphereGlow variant="cool" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <h2 className="mb-3 text-center font-heading text-3xl font-bold text-white md:text-4xl">
          A Welcoming Space for Healing
        </h2>
        <p className="editorial-serif mb-6 text-center text-xl text-sage-light md:text-2xl">
          A grounded, non-judgmental space for growth and resilience.
        </p>
        <BotanicalLine className="mx-auto mb-10 w-24" />
        <p className="editorial-serif mb-6 text-xl leading-relaxed text-parchment/90 md:text-2xl">
          {profile.bio}
        </p>
        <p className="leading-relaxed text-sage-light/95">
          <strong className="text-clay">
            Licensed Clinical Social Worker ({profile.credentials})
          </strong>{" "}
          {profile.bioHighlight}
        </p>
        <div className="organic-frame mx-auto mt-14 max-w-2xl overflow-hidden border border-sage-dark/30 shadow-2xl">
          <Image
            src={profile.aboutImageUrl}
            alt="Sunlight through trees – calm natural setting"
            width={800}
            height={480}
            className="h-64 w-full object-cover md:h-80"
          />
        </div>
      </div>
    </section>
  );
}
