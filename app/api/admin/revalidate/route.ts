import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";

const bodySchema = z.object({
  path: z.string().trim().min(1).optional(),
});

const DEFAULT_PATHS = ["/", "/articles", "/bookshelf", "/admin"] as const;

function safeRevalidate(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  // Revalidate the route segment tree so nested layouts refresh.
  revalidatePath(normalized, "layout");
  revalidatePath(normalized, "page");
  return normalized;
}

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

  try {
    if (path) {
      const normalized = safeRevalidate(path);
      return NextResponse.json({
        ok: true,
        message: `Revalidated ${normalized} (page + layout).`,
        paths: [normalized],
        revalidatedAt: new Date().toISOString(),
      });
    }

    const paths = DEFAULT_PATHS.map((p) => safeRevalidate(p));
    return NextResponse.json({
      ok: true,
      message:
        "Public cache flushed for /, /articles, /bookshelf, and /admin (page + layout).",
      paths,
      revalidatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[revalidate]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Cache revalidation failed.",
      },
      { status: 500 },
    );
  }
}
