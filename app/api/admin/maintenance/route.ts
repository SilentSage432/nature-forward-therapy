import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  setMaintenanceMode,
  getMaintenanceMode,
  bumpSessionEpoch,
} from "@/lib/system-settings";

function parseEnabled(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return false;
}

function revalidateMaintenanceSurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin", "layout");
  revalidatePath("/articles", "layout");
  revalidatePath("/bookshelf", "layout");
  revalidatePath("/maintenance", "page");
}

export async function GET(request: Request) {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Fail-safe: instantly force maintenance OFF and clear layout cache.
  if (action === "off") {
    const maintenance = await setMaintenanceMode(false);
    revalidateMaintenanceSurfaces();
    return NextResponse.json({
      message: "Maintenance mode forced OFF. Layout cache cleared.",
      maintenance,
    });
  }

  const maintenance = await getMaintenanceMode();
  return NextResponse.json({
    maintenance,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.flushSessions === true) {
    const epoch = await bumpSessionEpoch();
    return NextResponse.json({
      message: "Active JWT sessions invalidated. Users must sign in again.",
      sessionEpoch: epoch,
    });
  }

  if (!("enabled" in body)) {
    return NextResponse.json(
      { error: "Missing enabled flag." },
      { status: 400 },
    );
  }

  // Cleanly handle enabled === false (do not truthiness-coerce).
  const enabled =
    typeof body.enabled === "boolean"
      ? body.enabled
      : body.enabled === "true";

  const message =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : DEFAULT_MAINTENANCE_MESSAGE;

  const maintenance = await setMaintenanceMode(enabled, message);

  // Bust root layout + settings immediately so toggle-off is visible.
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidateMaintenanceSurfaces();

  return NextResponse.json(
    {
      message: maintenance.enabled
        ? "Maintenance mode enabled. Public visitors will see the holding page."
        : "Maintenance mode disabled. Public site restored.",
      maintenance,
      enabledParsed: parseEnabled(body.enabled),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
