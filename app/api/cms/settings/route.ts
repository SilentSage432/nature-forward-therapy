import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDeveloper } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await prisma.siteConfig.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!settings) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await prisma.siteConfig.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!settings) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    siteTitle?: string;
    siteDescription?: string;
  };

  const updated = await prisma.siteConfig.update({
    where: { id: settings.id },
    data: {
      siteTitle:
        typeof body.siteTitle === "string" ? body.siteTitle : settings.siteTitle,
      siteDescription:
        typeof body.siteDescription === "string"
          ? body.siteDescription
          : settings.siteDescription,
    },
  });

  return NextResponse.json(updated);
}
