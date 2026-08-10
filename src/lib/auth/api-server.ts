import { AUTH_HEADERS } from "@eduvy/contracts";
import { getWebAuthEnv } from "./env";

type ApiFetchOptions = RequestInit & {
  accessToken?: string;
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

export async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string; code?: string };
    return body.message ?? "Não foi possível concluir a operação.";
  } catch {
    return "Não foi possível concluir a operação.";
  }
}
