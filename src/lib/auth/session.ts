import { AUTH_COOKIES, type AuthSessionResponseDto } from "@eduvy/contracts";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getWebAuthEnv } from "./env";

export async function getAccessTokenPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIES.ACCESS)?.value;
  if (!token) return null;

  const env = getWebAuthEnv();
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || typeof payload.sid !== "string") return null;
    return { userId: payload.sub, sessionId: payload.sid };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthSessionResponseDto | null> {
  const payload = await getAccessTokenPayload();
  if (!payload) return null;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIES.ACCESS)?.value;
  if (!accessToken) return null;

  const { apiFetch } = await import("./api-server");
  const response = await apiFetch("/auth/me", {
    accessToken,
    bffOnly: false,
  });

  if (!response.ok) return null;

  const user = (await response.json()) as {
    id: string;
    email: string;
    fullName: string;
  };
  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
    sessionId: payload.sessionId,
  };
}
