/**
 * MAIAMARI.STUDIO — Proxy (Next 16'da eski "middleware")
 * ------------------------------------------------------
 * /admin altını korur: oturum cookie'si yoksa login'e yönlendirir.
 * Bu yalnızca iyimser (optimistic) bir kontroldür; gerçek imza
 * doğrulaması sayfa ve server action seviyesinde (requireAdmin) yapılır.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "mai_admin";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Login sayfası ve auth action'ları serbest.
  if (pathname === "/admin/login") return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(COOKIE_NAME)?.value);
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
