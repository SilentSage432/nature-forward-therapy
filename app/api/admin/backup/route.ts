import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildSiteBackup } from "@/lib/admin-ops";
import { isDeveloper } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const backup = await buildSiteBackup();
  const stamp = backup.exportedAt.slice(0, 19).replace(/[:T]/g, "-");
  const filename = `nature-forward-backup-${stamp}.json`;

  return new NextResponse(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
