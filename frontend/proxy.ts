import { NextRequest, NextResponse } from "next/server";

// The backend sets an httpOnly refresh token cookie; we can't read it here.
// We use a non-httpOnly "role" cookie set by the frontend after login.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = req.cookies.get("role")?.value;

  const isAuth = !!role;
  const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (!isAuth && !isAuthRoute && !pathname.startsWith("/checkout")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuth && isAuthRoute) {
    return NextResponse.redirect(new URL(getDashboard(role!), req.url));
  }

  // Role-based path guards
  if (pathname.startsWith("/platform") && role !== "PLATFORM_ADMIN") {
    return NextResponse.redirect(new URL(getDashboard(role!), req.url));
  }
  if (pathname.startsWith("/org") && role !== "ORG_ADMIN") {
    return NextResponse.redirect(new URL(getDashboard(role!), req.url));
  }
  if (pathname.startsWith("/me") && role !== "ORG_MEMBER") {
    return NextResponse.redirect(new URL(getDashboard(role!), req.url));
  }

  return NextResponse.next();
}

function getDashboard(role: string) {
  if (role === "PLATFORM_ADMIN") return "/platform/dashboard";
  if (role === "ORG_ADMIN") return "/org/dashboard";
  return "/me/profile";
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
