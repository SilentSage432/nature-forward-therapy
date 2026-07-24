import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  password: z.string().min(8).optional(),
  newPassword: z.string().min(8).optional(),
  confirmPassword: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Password must be at least 8 characters.",
      },
      { status: 400 },
    );
  }

  const newPassword = parsed.data.newPassword ?? parsed.data.password;
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      {
        success: false,
        message: "Password must be at least 8 characters.",
      },
      { status: 400 },
    );
  }

  if (
    parsed.data.confirmPassword !== undefined &&
    parsed.data.confirmPassword !== newPassword
  ) {
    return NextResponse.json(
      { success: false, message: "Passwords do not match." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      passwordHash: await hash(newPassword, 12),
      mustChangePassword: false,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Password updated successfully",
  });
}
