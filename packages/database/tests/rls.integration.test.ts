import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";
import { TENANT_SCOPED_TABLES } from "../scripts/verify-rls.tables";
import { APP_DATABASE_URL, createClient, withTenant } from "./helpers/db-client";

const describeIf = APP_DATABASE_URL ? describe : describe.skip;

describeIf("RLS fail-closed", () => {
  it("missing tenant context returns zero rows on tenant-scoped tables", async () => {
    const client = createClient();
    await client.connect();

    await client.query("BEGIN");
    await client.query(`SELECT set_config('app.tenant_id', '', true)`);
    await client.query(`SELECT set_config('app.user_id', '', true)`);

    for (const table of TENANT_SCOPED_TABLES) {
      const result = await client.query<{ total: number }>(
        `SELECT count(*)::int AS total FROM ${table}`,
      );
      expect(result.rows[0]?.total).toBe(0);
    }

    await client.query("COMMIT");
    await client.end();
  });

  it("INSERT without tenant context is denied on courses", async () => {
    const client = createClient();
    await client.connect();

    await client.query("BEGIN");
    await client.query(`SELECT set_config('app.tenant_id', '', true)`);
    await client.query(`SELECT set_config('app.user_id', '', true)`);

    await expect(
      client.query(
        `INSERT INTO courses (id, tenant_id, slug, title, status, updated_at)
         VALUES (gen_random_uuid(), gen_random_uuid(), 'x', 'X', 'DRAFT', NOW())`,
      ),
    ).rejects.toBeTruthy();

    await client.query("ROLLBACK");
    await client.end();
  });

  it("uses eduvy_app runtime role (no BYPASSRLS)", async () => {
    const client = createClient();
    await client.connect();
    const result = await client.query<{ rolname: string; rolbypassrls: boolean }>(
      `SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname = current_user`,
    );
    expect(result.rows[0]?.rolbypassrls).toBe(false);
    await client.end();
  });
});

describeIf("RLS adversarial", () => {
  it("tenant A cannot read tenant B courses without context match", async () => {
    const client = createClient();
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

    await withTenant(client, tenantB, async () => {
      await client.query(
        `INSERT INTO courses (id, tenant_id, slug, title, status, updated_at) VALUES ($1, $2, 'curso-b', 'Curso B', 'DRAFT', NOW())`,
        [courseB, tenantB],
      );
    });

    await withTenant(client, tenantA, async () => {
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
    });

    await withTenant(client, tenantA, async () => {
      await client.query(`DELETE FROM courses WHERE tenant_id = $1`, [tenantA]);
    });
    await withTenant(client, tenantB, async () => {
      await client.query(`DELETE FROM courses WHERE tenant_id = $1`, [tenantB]);
    });
    await client.query(`DELETE FROM tenants WHERE id IN ($1, $2)`, [tenantA, tenantB]);
    await client.end();
  });
});
