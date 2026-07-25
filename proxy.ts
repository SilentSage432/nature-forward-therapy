import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isLoggedIn = !!req.auth;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  if (isAdmin) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = req.auth?.user?.role;
    if (!canAccessAdminPath(role, pathname)) {
      return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/",
    "/articles",
    "/articles/:path*",
    "/bookshelf",
    "/maintenance",
  ],
};
