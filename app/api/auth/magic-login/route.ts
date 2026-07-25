import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=magic", request.url));
  }

  try {
    await signIn("magic-link", {
      token,
      redirectTo: "/admin",
    });
  } catch (error) {
    // Auth.js throws NEXT_REDIRECT on success — rethrow those.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.error("[magic-login]", error);
    return NextResponse.redirect(new URL("/login?error=magic", request.url));
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}
