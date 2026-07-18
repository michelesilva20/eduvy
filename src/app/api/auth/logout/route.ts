import { AUTH_COOKIES } from "@eduvy/contracts";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/auth/api-server";
import { clearAuthCookies } from "@/lib/auth/cookies";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIES.ACCESS)?.value;

  if (accessToken) {
    await apiFetch("/auth/logout", {
      method: "POST",
      accessToken,
    });
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
