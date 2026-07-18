import pg from "pg";
import { TENANT_SCOPED_TABLES } from "./verify-rls.tables";

async function main() {
  const connectionString = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL required");

  const client = new pg.Client({ connectionString });
  await client.connect();

  const missing: string[] = [];
  for (const table of TENANT_SCOPED_TABLES) {
    const result = await client.query<{ relrowsecurity: boolean; relforcerowsecurity: boolean }>(
      `SELECT c.relrowsecurity, c.relforcerowsecurity
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relname = $1`,
      [table],
    );
    const row = result.rows[0];
    if (!row?.relrowsecurity || !row.relforcerowsecurity) {
      missing.push(table);
    }
  }

  await client.end();

  if (missing.length > 0) {
    console.error("Tables without FORCE RLS:", missing.join(", "));
    process.exit(1);
  }

  console.log(`RLS verified on ${TENANT_SCOPED_TABLES.length} tenant-scoped tables.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
