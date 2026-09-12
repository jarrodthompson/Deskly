import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/base-config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPortalRoute = pathname.startsWith("/portal");
  const isPortalAuthRoute = pathname.startsWith("/portal/sign-in");
  const isStaffAuthRoute = pathname === "/sign-in";
  const isPublicRoute = pathname.startsWith("/api/auth") || pathname.startsWith("/_next");

  if (isPublicRoute) return NextResponse.next();

  if (isPortalRoute) {
    if (isPortalAuthRoute) {
      if (session?.user?.kind === "customer") {
        return NextResponse.redirect(new URL("/portal", req.url));
      }
      return NextResponse.next();
    }
    if (!session || session.user.kind !== "customer") {
      return NextResponse.redirect(new URL("/portal/sign-in", req.url));
    }
    return NextResponse.next();
  }

  if (isStaffAuthRoute) {
    if (session?.user?.kind === "staff") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!session || session.user.kind !== "staff") {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp)).*)"],
};
