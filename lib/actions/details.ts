"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { isEditor } from "@/lib/rbac";
import { INSURANCE_OPTIONS, PAYMENT_OPTIONS } from "@/lib/cms-options";
import type { ActionResult } from "@/lib/actions/profile";

export async function updateInsurancesAndPayments(
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return { ok: false, message: "Unauthorized." };
  }

  const selectedInsurances = formData.getAll("insurances").map(String);
  const selectedPayments = formData.getAll("paymentMethods").map(String);

  const validInsurances = selectedInsurances.filter((name) =>
    (INSURANCE_OPTIONS as readonly string[]).includes(name),
  );
  const validPayments = selectedPayments.filter((name) =>
    (PAYMENT_OPTIONS as readonly string[]).includes(name),
  );

  const practice = await prisma.practiceDetail.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!practice) {
    return { ok: false, message: "Practice details not found." };
  }

  const previousInsurances = await prisma.insurance.findMany({
    orderBy: { sortOrder: "asc" },
  });

  await prisma.$transaction([
    prisma.practiceDetail.update({
      where: { id: practice.id },
      data: {
        paymentMethods: validPayments,
      },
    }),
    prisma.insurance.deleteMany(),
  ]);

  if (validInsurances.length > 0) {
    await prisma.insurance.createMany({
      data: validInsurances.map((name, index) => ({
        name,
        sortOrder: index,
      })),
    });
  }

  const updatedPractice = await prisma.practiceDetail.findUnique({
    where: { id: practice.id },
  });

  await writeAuditLog({
    actor: { id: session!.user!.id, email: session!.user!.email },
    action: "CHANGE_INSURANCE",
    entity: "PracticeDetail",
    entityId: practice.id,
    previousState: {
      practice,
      insurances: previousInsurances,
    },
    newState: {
      practice: updatedPractice,
      insurances: validInsurances,
      paymentMethods: validPayments,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/details");
  revalidatePath("/admin/practice");

  return { ok: true, message: "Changes saved successfully! 🌿" };
}
