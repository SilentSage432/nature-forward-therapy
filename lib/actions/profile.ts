"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEditor } from "@/lib/rbac";

const profileSchema = z.object({
  name: z.string().min(1).max(120),
  credentials: z.string().min(1).max(80),
  tagline: z.string().min(1).max(500),
  bio: z.string().min(1).max(5000),
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

  await prisma.practitionerProfile.update({
    where: { id: profile.id },
    data: parsed.data,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/profile");

  return { ok: true, message: "Changes saved successfully! 🌿" };
}
