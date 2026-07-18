import { AUTH_COOKIES } from "@eduvy/contracts";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiFetch, readApiError } from "@/lib/auth/api-server";
import { getTenantContext } from "@/lib/tenancy/context";
import { applyActiveTenantCookie } from "@/lib/tenancy/cookies";

export async function POST(request: Request) {
  const body = (await request.json()) as { tenantId?: string };
  if (!body.tenantId) {
    return NextResponse.json({ message: "Organização inválida." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIES.ACCESS)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const tenantsResponse = await apiFetch("/tenants/mine", { accessToken, bffOnly: false });
  if (!tenantsResponse.ok) {
    const message = await readApiError(tenantsResponse);
    return NextResponse.json({ message }, { status: tenantsResponse.status });
  }

  const tenants = (await tenantsResponse.json()) as Array<{ id: string }>;
  const allowed = tenants.some((tenant) => tenant.id === body.tenantId);
  if (!allowed) {
    return NextResponse.json({ message: "Sem acesso a esta organização." }, { status: 403 });
  }

  const response = NextResponse.json(await getTenantContext(accessToken));
  applyActiveTenantCookie(response, body.tenantId);

  return response;
}
