import { expect } from "@jest/globals";
import pg from "pg";

/** Runtime app role — subject to FORCE RLS (same as API). */
export const APP_DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://eduvy_app:eduvy_app_dev@localhost:5437/eduvy";

/** Migration/superuser role for tenant bootstrap only. */
export const MIGRATION_DATABASE_URL =
  process.env.DATABASE_MIGRATION_URL ??
  "postgresql://eduvy_migration:eduvy_migration_dev@localhost:5437/eduvy";

export function createClient(url = APP_DATABASE_URL): pg.Client {
  return new pg.Client({ connectionString: url });
}

export async function withTenant<T>(
  client: pg.Client,
  tenantId: string,
  fn: () => Promise<T>,
): Promise<T> {
  await client.query("BEGIN");
  await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantId]);
  try {
    const result = await fn();
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function expectQueryError(
  fn: () => Promise<unknown>,
  codeFragment: string,
): Promise<void> {
  await expect(fn()).rejects.toMatchObject({
    code: expect.stringMatching(new RegExp(codeFragment, "i")),
  });
}
