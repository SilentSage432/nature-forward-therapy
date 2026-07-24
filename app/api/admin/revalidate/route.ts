import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";

export async function POST() {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath("/admin");

  return NextResponse.json({
    message: "Public cache revalidated for /, /articles, and /admin.",
    revalidatedAt: new Date().toISOString(),
  });
}
