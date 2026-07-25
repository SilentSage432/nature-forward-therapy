import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listAuditLogs } from "@/lib/audit";
import { isDeveloper } from "@/lib/rbac";

export async function GET(request: Request) {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const entity = searchParams.get("entity") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "50");

  const logs = await listAuditLogs({
    q,
    entity,
    limit: Number.isFinite(limit) ? limit : 50,
  });

  return NextResponse.json({ logs });
}
