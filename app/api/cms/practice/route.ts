import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEditor } from "@/lib/rbac";
import type { ProcessStep } from "@/lib/types";

function asStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

function asProcessSteps(value: Prisma.JsonValue | null | undefined): ProcessStep[] {
  if (!Array.isArray(value)) return [];
  return value.map((step) => {
    const s = step as { title?: unknown; description?: unknown };
    return {
      title: String(s.title ?? ""),
      description: String(s.description ?? ""),
    };
  });
}

export async function GET() {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [practice, insurances] = await Promise.all([
    prisma.practiceDetail.findFirst({ orderBy: { createdAt: "asc" } }),
    prisma.insurance.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!practice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: practice.id,
    expertise: asStringArray(practice.expertise),
    paymentMethods: asStringArray(practice.paymentMethods),
    insurances: insurances.map((i) => i.name),
    therapyTypes: asStringArray(practice.therapyTypes),
    processSteps: asProcessSteps(practice.processSteps),
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const practice = await prisma.practiceDetail.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!practice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    expertise?: string[];
    paymentMethods?: string[];
    insurances?: string[];
    therapyTypes?: string[];
    processSteps?: ProcessStep[];
  };

  const expertise = body.expertise ?? [];
  const paymentMethods = body.paymentMethods ?? [];
  const therapyTypes = body.therapyTypes ?? [];
  const processSteps = body.processSteps ?? [];
  const insurances = body.insurances ?? [];

  const [updated] = await prisma.$transaction([
    prisma.practiceDetail.update({
      where: { id: practice.id },
      data: {
        expertise,
        paymentMethods,
        therapyTypes,
        processSteps,
      },
    }),
    prisma.insurance.deleteMany(),
  ]);

  if (insurances.length > 0) {
    await prisma.insurance.createMany({
      data: insurances.map((name, index) => ({
        name,
        sortOrder: index,
      })),
    });
  }

  const nextInsurances = await prisma.insurance.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({
    id: updated.id,
    expertise: asStringArray(updated.expertise),
    paymentMethods: asStringArray(updated.paymentMethods),
    insurances: nextInsurances.map((i) => i.name),
    therapyTypes: asStringArray(updated.therapyTypes),
    processSteps: asProcessSteps(updated.processSteps),
  });
}
