import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDeveloper, isEditor } from "@/lib/rbac";

const postSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty.").max(8000),
});

const patchSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
  id: z.string().min(1).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !isEditor(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await prisma.supportMessage.findMany({
    orderBy: { createdAt: "asc" },
  });

  const openCount = messages.filter(
    (m) => m.status === "OPEN" || m.status === "IN_PROGRESS",
  ).length;

  return NextResponse.json({ messages, openCount });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !isEditor(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message." },
      { status: 400 },
    );
  }

  const created = await prisma.supportMessage.create({
    data: {
      senderId: session.user.id,
      senderEmail: session.user.email,
      senderRole: session.user.role,
      message: parsed.data.message,
      status: "OPEN",
    },
  });

  return NextResponse.json({ message: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !isDeveloper(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid status update." },
      { status: 400 },
    );
  }

  if (parsed.data.id) {
    const updated = await prisma.supportMessage.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ message: updated, updatedCount: 1 });
  }

  const result = await prisma.supportMessage.updateMany({
    where: {
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ updatedCount: result.count });
}
