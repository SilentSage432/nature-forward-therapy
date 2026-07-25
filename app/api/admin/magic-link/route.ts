import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDeveloper } from "@/lib/rbac";

const bodySchema = z.object({
  email: z.string().email().optional(),
  userId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const user = parsed.data.userId
    ? await prisma.user.findUnique({ where: { id: parsed.data.userId } })
    : await prisma.user.findFirst({
        where: {
          email: (
            parsed.data.email ??
            process.env.SEED_EDITOR_EMAIL ??
            "nicolegarcia@flockoffox.org"
          ).toLowerCase(),
        },
      });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.magicToken.create({
    data: {
      token,
      email: user.email,
      expiresAt,
    },
  });

  const origin =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    new URL(request.url).origin;
  const url = `${origin}/api/auth/magic-login?token=${token}`;

  console.info("[magic-link]", {
    email: user.email,
    expiresAt: expiresAt.toISOString(),
    url,
  });

  return NextResponse.json({
    url,
    email: user.email,
    expiresAt: expiresAt.toISOString(),
    message: `15-minute magic login link generated for ${user.email}.`,
  });
}
