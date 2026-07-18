import type { TenantContextDto, TenantSummaryDto } from "@eduvy/contracts";
import { AUTH_COOKIES } from "@eduvy/contracts";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/auth/api-server";

export async function fetchUserTenants(accessToken: string): Promise<TenantSummaryDto[]> {
  const response = await apiFetch<TenantSummaryDto[]>("/tenants/mine", {
    accessToken,
    bffOnly: false,
  });

  if (!response.ok) return [];
  return response.json();
}

export async function getTenantContext(accessToken: string): Promise<TenantContextDto> {
  const tenants = await fetchUserTenants(accessToken);
  const cookieStore = await cookies();
  const selectedId = cookieStore.get(AUTH_COOKIES.TENANT)?.value;

  const activeTenant =
    tenants.find((tenant) => tenant.id === selectedId) ?? tenants[0] ?? null;

  return { activeTenant, tenants };
}
