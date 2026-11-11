"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  locationSchema,
  optionalFaxSchema,
  optionalPhoneSchema,
  optionalPublicEmailSchema,
} from "@/lib/profile-contact";
import { prisma } from "@/lib/prisma";
import { revalidatePublicSurfaces } from "@/lib/public-cache";
import { isEditor } from "@/lib/rbac";

const profileSchema = z.object({
  name: z.string().min(1).max(120),
  credentials: z.string().min(1).max(80),
  tagline: z.string().min(1).max(500),
  bio: z.string().min(1).max(5000),
  location: locationSchema,
  phone: optionalPhoneSchema,
  fax: optionalFaxSchema,
  publicEmail: optionalPublicEmailSchema,
  headwayUrl: z.string().url(),
  psychologyTodayUrl: z.string().url(),
});

export type ActionResult = {
  ok: boolean;
  message: string;
};

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return { ok: false, message: "Unauthorized." };
  }

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    credentials: formData.get("credentials"),
    tagline: formData.get("tagline"),
    bio: formData.get("bio"),
    location: formData.get("location"),
    phone: formData.get("phone"),
    fax: formData.get("fax"),
    publicEmail: formData.get("publicEmail"),
    headwayUrl: formData.get("headwayUrl"),
    psychologyTodayUrl: formData.get("psychologyTodayUrl"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Please check the form fields and try again." };
  }

  const profile = await prisma.practitionerProfile.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!profile) {
    return { ok: false, message: "Profile not found." };
  }

  const updated = await prisma.practitionerProfile.update({
    where: { id: profile.id },
    data: parsed.data,
  });

  const bookingChanged =
    profile.headwayUrl !== updated.headwayUrl ||
    profile.psychologyTodayUrl !== updated.psychologyTodayUrl;

  const contactChanged =
    profile.location !== updated.location ||
    profile.phone !== updated.phone ||
    profile.fax !== updated.fax ||
    profile.publicEmail !== updated.publicEmail;

  await writeAuditLog({
    actor: { id: session!.user!.id, email: session!.user!.email },
    action: bookingChanged
      ? "UPDATE_BOOKING_LINK"
      : contactChanged
        ? "UPDATE_CONTACT"
        : "UPDATE_PROFILE",
    entity: "PractitionerProfile",
    entityId: updated.id,
    previousState: profile,
    newState: updated,
  });

  revalidatePublicSurfaces({
    includeHome: true,
    includeArticles: true,
    includeBookshelf: true,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/profile");

  return { ok: true, message: "Changes saved successfully." };
}
