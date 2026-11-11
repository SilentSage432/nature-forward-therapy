import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MAINTENANCE_PREVIEW_COOKIE } from "@/lib/public-cache-shared";
import { canAccessAdminPath } from "@/lib/rbac";
import {
  getMaintenanceModeCached,
  isPublicContentPath,
} from "@/lib/system-settings";

const PREVIEW_COOKIE_MAX_AGE = 120;

export const proxy = auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-url", req.nextUrl.href);

  if (isAdmin) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!canAccessAdminPath(role, pathname)) {
      return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Public marketing surfaces: enforce maintenance without dynamic RSC auth().
  if (isPublicContentPath(pathname)) {
    const maintenance = await getMaintenanceModeCached();
    if (maintenance.enabled) {
      if (role === "DEVELOPER") {
        const response = NextResponse.next({
          request: { headers: requestHeaders },
        });
        response.cookies.set(MAINTENANCE_PREVIEW_COOKIE, "1", {
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          httpOnly: false,
          maxAge: PREVIEW_COOKIE_MAX_AGE,
        });
        return response;
      }

      const rewrite = NextResponse.rewrite(
        new URL("/maintenance", req.nextUrl.origin),
      );
      rewrite.cookies.set(MAINTENANCE_PREVIEW_COOKIE, "", {
        path: "/",
        maxAge: 0,
      });
      return rewrite;
    }
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  // Clear stale developer preview cookie when maintenance is off.
  if (req.cookies.get(MAINTENANCE_PREVIEW_COOKIE)) {
    response.cookies.set(MAINTENANCE_PREVIEW_COOKIE, "", {
      path: "/",
      maxAge: 0,
    });
  }
  return response;
});

export const config = {
  matcher: [
    /*
     * Admin auth + public maintenance enforcement only.
     * Static assets / image optimizer / APIs are excluded so they stay cacheable
     * and avoid unnecessary Auth.js work.
     */
    "/",
    "/articles",
    "/articles/:path*",
    "/bookshelf",
    "/bookshelf/:path*",
    "/maintenance",
    "/login",
    "/admin",
    "/admin/:path*",
  ],
};
