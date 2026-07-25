import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";

const bodySchema = z.object({
  path: z.string().trim().min(1).optional(),
});

const DEFAULT_PATHS = ["/", "/articles", "/bookshelf", "/admin"] as const;

export async function POST(request: Request) {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let path: string | undefined;
  try {
    const json = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(json ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body." }, { status: 400 });
    }
    path = parsed.data.path;
  } catch {
    // Empty body → flush defaults.
  }

  if (path) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    revalidatePath(normalized);
    return NextResponse.json({
      message: `Revalidated ${normalized}.`,
      paths: [normalized],
      revalidatedAt: new Date().toISOString(),
    });
  }

  for (const p of DEFAULT_PATHS) {
    revalidatePath(p);
  }

  return NextResponse.json({
    message: "Public cache revalidated for /, /articles, /bookshelf, and /admin.",
    paths: [...DEFAULT_PATHS],
    revalidatedAt: new Date().toISOString(),
  });
}
