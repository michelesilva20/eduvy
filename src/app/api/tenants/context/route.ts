import { AUTH_COOKIES } from "@eduvy/contracts";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAccessTokenPayload } from "@/lib/auth/session";
import { getTenantContext } from "@/lib/tenancy/context";

export async function GET() {
  const payload = await getAccessTokenPayload();
  if (!payload) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIES.ACCESS)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const context = await getTenantContext(accessToken);
  return NextResponse.json(context);
}
