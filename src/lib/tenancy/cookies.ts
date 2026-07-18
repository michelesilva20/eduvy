import { AUTH_COOKIES } from "@eduvy/contracts";
import type { NextResponse } from "next/server";

export function applyActiveTenantCookie(response: NextResponse, tenantId: string) {
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(AUTH_COOKIES.TENANT, tenantId, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
