import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEditor } from "@/lib/rbac";

type SpecialtyInput = {
  id?: string;
  title: string;
  icon: string;
  description: string;
  sortOrder?: number;
};

type FocusTagInput = {
  id?: string;
  label: string;
  sortOrder?: number;
};

export async function GET() {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [specialties, focusTags] = await Promise.all([
    prisma.specialty.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.focusTag.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return NextResponse.json({ specialties, focusTags });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    specialties?: SpecialtyInput[];
    focusTags?: FocusTagInput[];
  };

  const specialties = Array.isArray(body.specialties) ? body.specialties : [];
  const focusTags = Array.isArray(body.focusTags) ? body.focusTags : [];

  await prisma.$transaction(async (tx) => {
    await tx.specialty.deleteMany();
    await tx.focusTag.deleteMany();

    if (specialties.length > 0) {
      await tx.specialty.createMany({
        data: specialties.map((item, index) => ({
          title: String(item.title ?? ""),
          icon: String(item.icon ?? ""),
          description: String(item.description ?? ""),
          sortOrder: item.sortOrder ?? index,
        })),
      });
    }

    if (focusTags.length > 0) {
      await tx.focusTag.createMany({
        data: focusTags.map((item, index) => ({
          label: String(item.label ?? ""),
          sortOrder: item.sortOrder ?? index,
        })),
      });
    }
  });

  const [nextSpecialties, nextFocusTags] = await Promise.all([
    prisma.specialty.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.focusTag.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return NextResponse.json({
    specialties: nextSpecialties,
    focusTags: nextFocusTags,
  });
}
