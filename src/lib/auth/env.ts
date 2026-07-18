import { loadWebAuthEnv } from "@eduvy/config";

let cachedEnv: ReturnType<typeof loadWebAuthEnv> | null = null;

export function getWebAuthEnv() {
  if (!cachedEnv) {
    cachedEnv = loadWebAuthEnv();
  }
  return cachedEnv;
}
