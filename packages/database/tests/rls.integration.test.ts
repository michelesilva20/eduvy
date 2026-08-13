import { describe, expect, it } from "@jest/globals";
import pg from "pg";
import { randomUUID } from "node:crypto";

const DATABASE_URL = process.env.DATABASE_URL;
const describeIf = DATABASE_URL ? describe : describe.skip;

describeIf("RLS adversarial", () => {
  it("tenant A cannot read tenant B courses without context match", async () => {
    const client = new pg.Client({ connectionString: DATABASE_URL });
    await client.connect();

    const tenantA = randomUUID();
    const tenantB = randomUUID();
    const courseB = randomUUID();

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
    const result = await client.query(`SELECT id FROM courses WHERE id = $1`, [courseB]);
    expect(result.rowCount).toBe(0);

    const courseA = randomUUID();
    await client.query(
      `INSERT INTO courses (id, tenant_id, slug, title, status, updated_at) VALUES ($1, $2, 'curso-a', 'Curso A', 'DRAFT', NOW())`,
      [courseA, tenantA],
    );
    const own = await client.query(`SELECT id, title FROM courses WHERE id = $1`, [courseA]);
    expect(own.rowCount).toBe(1);
    expect(own.rows[0]?.title).toBe("Curso A");
    await client.query("COMMIT");

    await client.end();
  });

  it("missing tenant context returns zero tenant rows", async () => {
    const client = new pg.Client({ connectionString: DATABASE_URL });
    await client.connect();
    await client.query("BEGIN");
    await client.query(`SELECT set_config('app.tenant_id', '', true)`);
    const result = await client.query(`SELECT count(*)::int AS total FROM courses`);
    expect(result.rows[0]?.total).toBe(0);
    await client.query("COMMIT");
    await client.end();
  });
});
