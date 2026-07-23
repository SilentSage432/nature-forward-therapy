"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/lib/actions/profile";
import { isEditor } from "@/lib/rbac";

const SUPPORT_INBOX = "dev@flockoffox.org";

const supportSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, "Please share a bit more detail (at least 10 characters).")
    .max(4000, "Message is too long."),
});

export async function submitSupportRequest(
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || !isEditor(session.user.role)) {
    return { ok: false, message: "Unauthorized." };
  }

  const parsed = supportSchema.safeParse({
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid message.",
    };
  }

  // Structured notification for server logs / hosting log drains until SMTP is wired.
  console.info("[support-request]", {
    to: SUPPORT_INBOX,
    fromUserId: session.user.id,
    fromEmail: session.user.email,
    fromName: session.user.name,
    fromRole: session.user.role,
    message: parsed.data.message,
    submittedAt: new Date().toISOString(),
  });

  return {
    ok: true,
    message: `Support request received. We'll follow up soon — or email ${SUPPORT_INBOX} anytime.`,
  };
}
