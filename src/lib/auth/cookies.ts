import type { AuthLoginResponseDto } from "@eduvy/contracts";
import { AUTH_COOKIES } from "@eduvy/contracts";
import type { NextResponse } from "next/server";

function cookieBase() {
  const secure = process.env.NODE_ENV === "production";
  return { secure, sameSite: "lax" as const, path: "/" };
}

export function applyAuthCookies(response: NextResponse, data: AuthLoginResponseDto) {
  const base = cookieBase();

  response.cookies.set(AUTH_COOKIES.ACCESS, data.accessToken, {
    ...base,
    httpOnly: true,
    expires: new Date(data.accessExpiresAt),
  });

  response.cookies.set(AUTH_COOKIES.REFRESH, data.refreshToken, {
    ...base,
    httpOnly: true,
    expires: new Date(data.refreshExpiresAt),
  });

  response.cookies.set(AUTH_COOKIES.SESSION, data.sessionId, {
    ...base,
    httpOnly: true,
    expires: new Date(data.refreshExpiresAt),
  });

  response.cookies.set(AUTH_COOKIES.CSRF, data.csrfToken, {
    ...base,
    httpOnly: false,
    expires: new Date(data.refreshExpiresAt),
  });
}

export function clearAuthCookies(response: NextResponse) {
  const base = cookieBase();
  const names = Object.values(AUTH_COOKIES) as string[];

  for (const name of names) {
    response.cookies.set(name, "", {
      ...base,
      httpOnly: name !== AUTH_COOKIES.CSRF,
      maxAge: 0,
    });
  }
}