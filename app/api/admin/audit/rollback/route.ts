import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { rollbackAuditLog } from "@/lib/audit";
import { isDeveloper } from "@/lib/rbac";

const bodySchema = z.object({
  auditId: z.string().min(1),
});

export async function POST(request: Request) {
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "auditId is required." }, { status: 400 });
  }

  const result = await rollbackAuditLog(parsed.data.auditId, {
    id: session.user.id,
    email: session.user.email,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath("/bookshelf");
  revalidatePath("/admin");
  revalidatePath("/admin/activity");

  return NextResponse.json({ message: result.message });
}
