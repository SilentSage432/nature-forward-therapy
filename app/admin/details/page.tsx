import { redirect } from "next/navigation";
import { DetailsForm } from "@/components/admin/DetailsForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEditor } from "@/lib/rbac";
import { FALLBACK_CONTENT } from "@/lib/types";
import type { Prisma } from "@prisma/client";

function asStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

export default async function AdminDetailsPage() {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    redirect("/login");
  }

  const [insurances, practice] = await Promise.all([
    prisma.insurance.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.practiceDetail.findFirst({ orderBy: { createdAt: "asc" } }),
  ]);

  const activeInsurances =
    insurances.length > 0
      ? insurances.map((item) => item.name)
      : FALLBACK_CONTENT.practice.insurances;

  const activePayments = practice
    ? asStringArray(practice.paymentMethods)
    : FALLBACK_CONTENT.practice.paymentMethods;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white">
          Insurances &amp; Payments
        </h1>
        <p className="mt-2 text-sage-light">
          Toggle accepted plans and payment methods. Updates sync to the public
          site right away.
        </p>
      </div>
      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <DetailsForm
          activeInsurances={activeInsurances}
          activePayments={activePayments}
        />
      </div>
    </div>
  );
}
