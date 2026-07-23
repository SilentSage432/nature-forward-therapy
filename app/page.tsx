import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { Specialties } from "@/components/Specialties";
import { getSiteContent } from "@/lib/content";

export default async function HomePage() {
  const content = await getSiteContent();

  return (
    <>
      <Navbar />
      <main>
        <Hero profile={content.profile} />
        <About profile={content.profile} />
        <Specialties
          profile={content.profile}
          specialties={content.specialties}
          focusTags={content.focusTags}
          practice={content.practice}
        />
        <Contact
          profile={content.profile}
          processSteps={content.practice.processSteps}
        />
      </main>
      <Footer profile={content.profile} />
    </>
  );
}
