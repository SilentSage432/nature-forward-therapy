"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDeveloper } from "@/lib/rbac";
import type { ActionResult } from "@/lib/actions/profile";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.");

export async function changeOwnPassword(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Unauthorized." };
  }

  // Developers are never forced through this flow; editors must change when required.
  if (session.user.role !== "EDITOR") {
    return { ok: false, message: "Password update flow is for editor accounts." };
  }

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  if (password !== confirm) {
    return { ok: false, message: "Passwords do not match." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      passwordHash: await hash(password, 12),
      mustChangePassword: false,
    },
  });

  revalidatePath("/admin");
  return { ok: true, message: "Changes saved successfully! 🌿" };
}

export async function toggleMustChangePassword(
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    return { ok: false, message: "Forbidden." };
  }

  const userId = String(formData.get("userId") ?? "");
  const nextValue = formData.get("value") === "true";
  if (!userId) {
    return { ok: false, message: "User is required." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { mustChangePassword: nextValue },
  });

  revalidatePath("/admin/users");
  return {
    ok: true,
    message: nextValue
      ? "User must change password on next login."
      : "Password change requirement cleared.",
  };
}

export async function resetUserPassword(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    return { ok: false, message: "Forbidden." };
  }

  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");
  const forceChange = formData.get("mustChangePassword") === "on";

  if (!userId) {
    return { ok: false, message: "User is required." };
  }

  const data: {
    mustChangePassword: boolean;
    passwordHash?: string;
  } = {
    mustChangePassword: forceChange || Boolean(password),
  };

  if (password) {
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Invalid password.",
      };
    }
    data.passwordHash = await hash(password, 12);
    data.mustChangePassword = true;
  }

  if (!password && !forceChange) {
    return {
      ok: false,
      message: "Provide a temporary password and/or force password change.",
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data,
  });

  revalidatePath("/admin/users");
  return { ok: true, message: "User password settings updated." };
}
