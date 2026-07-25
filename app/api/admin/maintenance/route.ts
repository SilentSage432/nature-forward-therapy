import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  setMaintenanceMode,
  getMaintenanceMode,
  bumpSessionEpoch,
} from "@/lib/system-settings";

const maintenanceSchema = z.object({
  enabled: z.boolean(),
  message: z.string().trim().max(500).optional(),
});

const flushSchema = z.object({
  flushSessions: z.literal(true),
});

function revalidatePublicSurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/articles", "layout");
  revalidatePath("/bookshelf", "layout");
  revalidatePath("/maintenance", "page");
  revalidatePath("/admin", "layout");
}

export async function GET() {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const maintenance = await getMaintenanceMode();
  return NextResponse.json({ maintenance });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const flushParsed = flushSchema.safeParse(body);
  if (flushParsed.success) {
    const epoch = await bumpSessionEpoch();
    return NextResponse.json({
      message: "Active JWT sessions invalidated. Users must sign in again.",
      sessionEpoch: epoch,
    });
  }

  const parsed = maintenanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body." },
      { status: 400 },
    );
  }

  const maintenance = await setMaintenanceMode(
    parsed.data.enabled,
    parsed.data.message ?? DEFAULT_MAINTENANCE_MESSAGE,
  );

  revalidatePublicSurfaces();

  return NextResponse.json({
    message: maintenance.enabled
      ? "Maintenance mode enabled. Public visitors will see the holding page."
      : "Maintenance mode disabled. Public site restored.",
    maintenance,
  });
}
