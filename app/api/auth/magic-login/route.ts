import { NextResponse } from "next/server";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();
  const loginError = new URL("/login?error=magic", request.url);
  const adminUrl = new URL("/admin", request.url);

  if (!token) {
    return NextResponse.redirect(loginError);
  }

  try {
    const result = await signIn("magic-link", {
      token,
      redirect: false,
    });

    if (!result || result.error || (result as { ok?: boolean }).ok === false) {
      console.error("[magic-login] rejected", result);
      return NextResponse.redirect(loginError);
    }

    return NextResponse.redirect(adminUrl);
  } catch (error) {
    // Some Auth.js versions still throw a redirect on success.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    if (error instanceof AuthError) {
      console.error("[magic-login]", error.type, error.message);
      return NextResponse.redirect(loginError);
    }
    console.error("[magic-login]", error);
    return NextResponse.redirect(loginError);
  }
}
