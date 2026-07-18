import { AUTH_COOKIES } from "@eduvy/contracts";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIES.ACCESS)?.value;
  const secretValue = process.env.JWT_ACCESS_SECRET;

  if (!token || !secretValue) {
    return redirectToLogin(request);
  }

  try {
    const secret = new TextEncoder().encode(secretValue);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/app/:path*"],
};
