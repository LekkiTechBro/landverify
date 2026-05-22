import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/", "/dashboard", "/buyer", "/kyc", "/purchase", "/payment", "/crm", "/admin", "/search", "/map", "/property"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const isProtected = PROTECTED.some(r => pathname === r || pathname.startsWith(r + "/"));

  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};