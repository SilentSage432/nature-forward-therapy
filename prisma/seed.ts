import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { FALLBACK_CONTENT } from "../lib/types";

const prisma = new PrismaClient();

async function main() {
  const developerEmail = (
    process.env.SEED_DEVELOPER_EMAIL ?? "dev@flockoffox.org"
  ).toLowerCase();
  const editorEmail = (
    process.env.SEED_EDITOR_EMAIL ?? "nicolegarcia@flockoffox.org"
  ).toLowerCase();
  const developerPassword =
    process.env.SEED_DEVELOPER_PASSWORD ?? "ChangeMeDev!";
  const editorPassword =
    process.env.SEED_EDITOR_PASSWORD ?? "ChangeMeEditor!";
  const editorPasswordHash = await hash(editorPassword, 12);

  // Migrate legacy editor seed email if present.
  const legacyEditorEmail = "nicole@flockoffox.org";
  if (editorEmail !== legacyEditorEmail) {
    const legacy = await prisma.user.findUnique({
      where: { email: legacyEditorEmail },
    });
    const target = await prisma.user.findUnique({
      where: { email: editorEmail },
    });
    if (legacy && !target) {
      await prisma.user.update({
        where: { email: legacyEditorEmail },
        data: {
          email: editorEmail,
          name: "Nicole Garcia",
          role: "EDITOR",
          passwordHash: editorPasswordHash,
          mustChangePassword: true,
        },
      });
    } else if (legacy && target) {
      await prisma.user.delete({ where: { email: legacyEditorEmail } });
    }
  }

  await prisma.user.upsert({
    where: { email: developerEmail },
    update: {
      role: "DEVELOPER",
      name: "Site Developer",
      // Developers must never be blocked by the force-password modal.
      mustChangePassword: false,
    },
    create: {
      email: developerEmail,
      name: "Site Developer",
      role: "DEVELOPER",
      passwordHash: await hash(developerPassword, 12),
      mustChangePassword: false,
    },
  });

  await prisma.user.upsert({
    where: { email: editorEmail },
    update: {
      role: "EDITOR",
      name: "Nicole Garcia",
      passwordHash: editorPasswordHash,
      mustChangePassword: true,
    },
    create: {
      email: editorEmail,
      name: "Nicole Garcia",
      role: "EDITOR",
      passwordHash: editorPasswordHash,
      mustChangePassword: true,
    },
  });

  const existingProfile = await prisma.practitionerProfile.findFirst();
  if (!existingProfile) {
    const p = FALLBACK_CONTENT.profile;
    await prisma.practitionerProfile.create({
      data: {
        name: p.name,
        credentials: p.credentials,
        location: p.location,
        tagline: p.tagline,
        bio: p.bio,
        bioHighlight: p.bioHighlight,
        headshotPath: p.headshotPath,
        headwayUrl: p.headwayUrl,
        psychologyTodayUrl: p.psychologyTodayUrl,
        heroBackgroundUrl: p.heroBackgroundUrl,
        aboutImageUrl: p.aboutImageUrl,
        specialtiesImageUrl: p.specialtiesImageUrl,
        contactImageUrl: p.contactImageUrl,
        footerCredit: p.footerCredit,
      },
    });
  }

  const specialtyCount = await prisma.specialty.count();
  if (specialtyCount === 0) {
    await prisma.specialty.createMany({
      data: FALLBACK_CONTENT.specialties.map((s) => ({
        title: s.title,
        icon: s.icon,
        description: s.description,
        sortOrder: s.sortOrder,
      })),
    });
  }

  const tagCount = await prisma.focusTag.count();
  if (tagCount === 0) {
    await prisma.focusTag.createMany({
      data: FALLBACK_CONTENT.focusTags.map((t) => ({
        label: t.label,
        sortOrder: t.sortOrder,
      })),
    });
  }

  const insuranceCount = await prisma.insurance.count();
  if (insuranceCount === 0) {
    await prisma.insurance.createMany({
      data: FALLBACK_CONTENT.practice.insurances.map((name, index) => ({
        name,
        sortOrder: index,
      })),
    });
  }

  const existingPractice = await prisma.practiceDetail.findFirst();
  if (!existingPractice) {
    const pr = FALLBACK_CONTENT.practice;
    await prisma.practiceDetail.create({
      data: {
        expertise: pr.expertise,
        paymentMethods: pr.paymentMethods,
        therapyTypes: pr.therapyTypes,
        processSteps: pr.processSteps,
      },
    });
  }

  const existingSite = await prisma.siteConfig.findFirst();
  if (!existingSite) {
    await prisma.siteConfig.create({
      data: {
        siteTitle: FALLBACK_CONTENT.site.siteTitle,
        siteDescription: FALLBACK_CONTENT.site.siteDescription,
      },
    });
  }

  const sampleArticles = [
    {
      title:
        "Navigating Uncharted Transitions: Finding Grounding When Life Shifts",
      slug: "navigating-uncharted-transitions",
      category: "Life Transitions",
      excerpt:
        "When the familiar dissolves, grounding is not about forcing certainty—it is about returning to what steadies you, moment by moment.",
      coverImage:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80",
      content: `Life transitions rarely announce themselves with clarity. A move, a loss, a new role, or a quiet inner shift can leave you standing in unfamiliar terrain without a map.

## Finding ground beneath the shift

Grounding begins with noticing what is still true. Your breath. The feeling of your feet against the floor. A walk beneath trees. These are not distractions from the transition—they are anchors that help your nervous system remember safety while everything else rearranges.

## Permission to move slowly

You do not have to metabolize change at the speed the world demands. Therapy can be a place to name what is ending, honor what is arriving, and practice staying present when the urge is to rush ahead or disappear into the past.

If you are in the middle of an uncharted season, you are not behind. You are becoming—and that deserves gentle company.`,
    },
    {
      title: "The Art of Relational Presence: Cultivating Emotional Safety",
      slug: "art-of-relational-presence",
      category: "Relational Health",
      excerpt:
        "Emotional safety grows when we practice presence—listening without fixing, staying curious without collapsing into defense.",
      coverImage:
        "https://images.unsplash.com/photo-1511497584788-876760111969?w=1200&q=80",
      content: `Relational presence is less a technique than a way of being with another person. It asks us to arrive fully—curious, regulated enough to stay, and willing to let another person’s inner world matter.

## Safety is co-created

Emotional safety is not something one person grants to another. It emerges when both people can express need, repair rupture, and trust that difference will not end the connection. Couples and individuals alike benefit from practicing small moments of attunement: pausing before responding, reflecting what you heard, naming your own feeling without blame.

## Presence over performance

Many of us learned to perform care rather than offer presence. Presence sounds like: “I am here with you in this.” It does not require perfect words. It requires willingness.

In therapy, we practice this art together—so that the capacity for safety can travel with you into the relationships that matter most.`,
    },
  ] as const;

  for (const article of sampleArticles) {
    await prisma.blogPost.upsert({
      where: { slug: article.slug },
      update: {},
      create: {
        ...article,
        published: true,
        publishedAt: new Date(),
      },
    });
  }

  console.log("Seed complete.");
  console.log(`Developer: ${developerEmail} (DEVELOPER)`);
  console.log(`Editor:    ${editorEmail} (EDITOR)`);
  console.log(`Articles:  ${sampleArticles.length} sample essays upserted`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
