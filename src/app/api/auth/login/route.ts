import type { AuthLoginResponseDto } from "@eduvy/contracts";
import { NextResponse } from "next/server";
import { ApiUnavailableError, apiFetch, readApiError } from "@/lib/auth/api-server";
import { applyAuthCookies } from "@/lib/auth/cookies";
import { fetchUserTenants } from "@/lib/tenancy/context";
import { applyActiveTenantCookie } from "@/lib/tenancy/cookies";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
    rememberMe?: boolean;
  };

  try {
    const response = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await readApiError(response);
      return NextResponse.json({ message }, { status: response.status });
    }

    const data = (await response.json()) as AuthLoginResponseDto;
    const nextResponse = NextResponse.json({
      user: data.user,
    });
    applyAuthCookies(nextResponse, data);

    const tenants = await fetchUserTenants(data.accessToken);
    if (tenants[0]) {
      applyActiveTenantCookie(nextResponse, tenants[0].id);
    }

    return nextResponse;
  } catch (error) {
    if (error instanceof ApiUnavailableError) {
      return NextResponse.json({ message: error.message, code: error.code }, { status: 503 });
    }
    throw error;
  }
}
