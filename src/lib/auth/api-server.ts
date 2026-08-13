import { AUTH_COOKIES, AUTH_HEADERS } from "@eduvy/contracts";
import { cookies } from "next/headers";
import { getWebAuthEnv } from "./env";

type ApiFetchOptions = RequestInit & {
  accessToken?: string;
  tenantId?: string;
  bffOnly?: boolean;
};

export class ApiUnavailableError extends Error {
  readonly code = "API_OFFLINE";

  constructor() {
    super(
      "A API não está respondendo. Abra outro terminal na raiz do projeto e rode: pnpm dev:api",
    );
    this.name = "ApiUnavailableError";
  }
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const env = getWebAuthEnv();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.bffOnly !== false) {
    headers.set(AUTH_HEADERS.BFF_SECRET, env.EDUVY_BFF_SECRET);
  }

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  if (options.tenantId) {
    headers.set(AUTH_HEADERS.TENANT_ID, options.tenantId);
  }

  try {
    return await fetch(`${env.EDUVY_API_URL}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiUnavailableError();
  }
}

export async function apiFetchWithSession(
  path: string,
  options: Omit<ApiFetchOptions, "accessToken" | "tenantId"> & {
    requireTenant?: boolean;
  } = {},
): Promise<Response> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIES.ACCESS)?.value;
  const tenantId = cookieStore.get(AUTH_COOKIES.TENANT)?.value;

  if (!accessToken) {
    return new Response(JSON.stringify({ message: "Não autenticado." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let resolvedTenantId = tenantId;
  if (options.requireTenant !== false && !resolvedTenantId) {
    const tenantsResponse = await apiFetch("/tenants/mine", {
      accessToken,
      bffOnly: false,
    });
    if (tenantsResponse.ok) {
      const tenants = (await tenantsResponse.json()) as Array<{ id: string }>;
      resolvedTenantId = tenants[0]?.id;
    }
  }

  if (options.requireTenant !== false && !resolvedTenantId) {
    return new Response(JSON.stringify({ message: "Selecione uma organização." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return apiFetch(path, {
    ...options,
    accessToken,
    tenantId: options.requireTenant === false ? undefined : resolvedTenantId,
    bffOnly: false,
  });
}

export async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string; code?: string };
    return body.message ?? "Não foi possível concluir a operação.";
  } catch {
    return "Não foi possível concluir a operação.";
  }
}
