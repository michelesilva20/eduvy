import pg from "pg";
import { randomUUID } from "node:crypto";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

try {
  const tenantA = randomUUID();
  const tenantB = randomUUID();
  const courseB = randomUUID();
  const courseA = randomUUID();

  await client.query(
    `INSERT INTO tenants (id, name, slug, status, updated_at) VALUES ($1, 'A', $2, 'ACTIVE', NOW())`,
    [tenantA, `t-a-${tenantA.slice(0, 8)}`],
  );
  await client.query(
    `INSERT INTO tenants (id, name, slug, status, updated_at) VALUES ($1, 'B', $2, 'ACTIVE', NOW())`,
    [tenantB, `t-b-${tenantB.slice(0, 8)}`],
  );

  await client.query("BEGIN");
  await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantB]);
  await client.query(
    `INSERT INTO courses (id, tenant_id, slug, title, status, updated_at) VALUES ($1, $2, 'curso-b', 'Curso B', 'DRAFT', NOW())`,
    [courseB, tenantB],
  );
  await client.query("COMMIT");

  await client.query("BEGIN");
  await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantA]);
  const cross = await client.query(`SELECT id FROM courses WHERE id = $1`, [courseB]);
  if (cross.rowCount !== 0) {
    throw new Error("FAIL: tenant A can see tenant B course");
  }

  await client.query(
    `INSERT INTO courses (id, tenant_id, slug, title, status, updated_at) VALUES ($1, $2, 'curso-a', 'Curso A', 'DRAFT', NOW())`,
    [courseA, tenantA],
  );
  const own = await client.query(`SELECT title FROM courses WHERE id = $1`, [courseA]);
  if (own.rows[0]?.title !== "Curso A") {
    throw new Error("FAIL: tenant A cannot see own course");
  }
  await client.query("COMMIT");

  console.log("PASS: courses tenant isolation");
} finally {
  await client.end();
}
