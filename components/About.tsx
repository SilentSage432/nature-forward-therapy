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
      className="curve-bottom relative scroll-mt-24 overflow-hidden px-6 py-20 md:py-28"
    >
      <AtmosphereGlow variant="cool" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <h2 className="site-fg-heading mb-3 text-center font-heading font-bold">
          A Welcoming Space for Healing
        </h2>
        <p className="site-fg-supporting editorial-serif mb-6 text-center">
          A grounded, non-judgmental space for growth and resilience.
        </p>
        <BotanicalLine className="mx-auto mb-10 w-24" />
        <p className="site-fg-soft editorial-serif mb-6 leading-relaxed opacity-90">
          {profile.bio}
        </p>
        <p className="site-fg-supporting leading-relaxed opacity-95">
          <strong className="site-accent-secondary">
            Licensed Clinical Social Worker ({profile.credentials})
          </strong>{" "}
          {profile.bioHighlight}
        </p>
        <div className="site-border-organic-soft organic-frame mx-auto mt-14 max-w-2xl overflow-hidden border shadow-2xl">
          <Image
            src={profile.aboutImageUrl}
            alt="Sunlight through trees – calm natural setting"
            width={800}
            height={480}
            quality={80}
            sizes="(max-width: 768px) 100vw, 672px"
            className="h-64 w-full object-cover md:h-80"
          />
        </div>
      </div>
    </section>
  );
}
