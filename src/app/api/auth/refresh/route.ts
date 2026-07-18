import type { AuthLoginResponseDto } from "@eduvy/contracts";
import { AUTH_COOKIES } from "@eduvy/contracts";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiFetch, readApiError } from "@/lib/auth/api-server";
import { applyAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(AUTH_COOKIES.REFRESH)?.value;
  const sessionId = cookieStore.get(AUTH_COOKIES.SESSION)?.value;

  if (!refreshToken || !sessionId) {
    const response = NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const apiResponse = await apiFetch<AuthLoginResponseDto>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken, sessionId }),
  });

  if (!apiResponse.ok) {
    const message = await readApiError(apiResponse);
    const response = NextResponse.json({ message }, { status: apiResponse.status });
    clearAuthCookies(response);
    return response;
  }

  const data = (await apiResponse.json()) as AuthLoginResponseDto;
  const response = NextResponse.json({ ok: true });
  applyAuthCookies(response, data);
  return response;
}
