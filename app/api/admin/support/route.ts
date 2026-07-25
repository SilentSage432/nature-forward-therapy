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
    where: {
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    messages,
    openCount: messages.length,
  });
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

  // Notify Discord when Nicole / EDITOR posts (never block DB success on webhook failure).
  if (
    session.user.role === "EDITOR" &&
    process.env.DISCORD_SUPPORT_WEBHOOK_URL
  ) {
    try {
      const discordMessage =
        parsed.data.message.length > 1024
          ? `${parsed.data.message.slice(0, 1021)}...`
          : parsed.data.message;

      await fetch(process.env.DISCORD_SUPPORT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Nicole - Support Chat",
          embeds: [
            {
              title: "💬 New In-App Support Message",
              description: "Message from Nicole on flockoffox.org",
              color: 13919335,
              fields: [
                {
                  name: "Sender Email",
                  value: session.user.email,
                  inline: true,
                },
                {
                  name: "Message",
                  value: discordMessage,
                },
              ],
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    } catch {
      // Discord outage / rate limit must not fail the support message save.
    }
  }

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

  if (parsed.data.status === "RESOLVED") {
    const result = await prisma.supportMessage.updateMany({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      data: { status: "RESOLVED" },
    });
    return NextResponse.json({ updatedCount: result.count });
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
