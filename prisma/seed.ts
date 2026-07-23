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
    },
    create: {
      email: developerEmail,
      name: "Site Developer",
      role: "DEVELOPER",
      passwordHash: await hash(developerPassword, 12),
      mustChangePassword: true,
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

  console.log("Seed complete.");
  console.log(`Developer: ${developerEmail} (DEVELOPER)`);
  console.log(`Editor:    ${editorEmail} (EDITOR)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
