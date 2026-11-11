import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { normalizeRequiredLocation } from "@/lib/profile-contact";
import { prisma } from "@/lib/prisma";
import {
  DEVELOPER_PROFILE_FIELDS,
  EDITOR_PROFILE_FIELDS,
  isDeveloper,
  isEditor,
} from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.practitionerProfile.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.practitionerProfile.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  // phone / fax / publicEmail are intentionally absent from EDITOR_PROFILE_FIELDS
  // so this legacy allowlist cannot bypass Zod validation in updateProfile.
  const allowed = new Set<string>([...EDITOR_PROFILE_FIELDS]);
  if (isDeveloper(session?.user?.role)) {
    for (const field of DEVELOPER_PROFILE_FIELDS) allowed.add(field);
  }

  const data: Record<string, string> = {};
  for (const key of allowed) {
    if (key === "location") continue;
    if (typeof body[key] === "string") {
      data[key] = body[key];
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "location")) {
    try {
      data.location = normalizeRequiredLocation(body.location);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Invalid location.",
        },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.practitionerProfile.update({
    where: { id: profile.id },
    data,
  });

  return NextResponse.json(updated);
}
