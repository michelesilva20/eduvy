import { randomUUID } from "node:crypto";
import type pg from "pg";
import { MIGRATION_DATABASE_URL, createClient, withTenant } from "./db-client";

export type TenantFixture = {
  tenantId: string;
  userId: string;
  membershipId: string;
  courseId: string;
  courseVersionId: string;
  courseModuleId: string;
  lessonId: string;
  cohortId: string;
  enrollmentId: string;
  assessmentId: string;
  questionId: string;
};

async function insertTenant(client: pg.Client, slugPrefix: string): Promise<string> {
  const tenantId = randomUUID();
  await client.query(
    `INSERT INTO tenants (id, name, slug, status, updated_at)
     VALUES ($1, $2, $3, 'ACTIVE', NOW())`,
    [tenantId, `Tenant ${slugPrefix}`, `${slugPrefix}-${tenantId.slice(0, 8)}`],
  );
  return tenantId;
}

async function insertUser(client: pg.Client, email: string): Promise<string> {
  const userId = randomUUID();
  await client.query(
    `INSERT INTO users (id, email, full_name, updated_at)
     VALUES ($1, $2, $3, NOW())`,
    [userId, email, "Test User"],
  );
  return userId;
}

export async function seedTenantLearningCore(slugPrefix: string): Promise<TenantFixture> {
  const bootstrap = createClient(MIGRATION_DATABASE_URL);
  await bootstrap.connect();

  const tenantId = await insertTenant(bootstrap, slugPrefix);
  const userId = await insertUser(bootstrap, `${slugPrefix}-${randomUUID().slice(0, 8)}@test.local`);
  await bootstrap.end();

  const client = createClient(MIGRATION_DATABASE_URL);
  await client.connect();

  const ids = {
    membershipId: randomUUID(),
    courseId: randomUUID(),
    courseVersionId: randomUUID(),
    courseModuleId: randomUUID(),
    lessonId: randomUUID(),
    cohortId: randomUUID(),
    enrollmentId: randomUUID(),
    assessmentId: randomUUID(),
    questionId: randomUUID(),
  };

  await withTenant(client, tenantId, async () => {
    await client.query(
      `INSERT INTO memberships (id, tenant_id, user_id, status, joined_at, updated_at)
       VALUES ($1, $2, $3, 'ACTIVE', NOW(), NOW())`,
      [ids.membershipId, tenantId, userId],
    );

    await client.query(
      `INSERT INTO courses (id, tenant_id, slug, title, status, updated_at)
       VALUES ($1, $2, $3, 'Course', 'DRAFT', NOW())`,
      [ids.courseId, tenantId, `course-${ids.courseId.slice(0, 8)}`],
    );

    await client.query(
      `INSERT INTO course_versions (id, tenant_id, course_id, version, status, updated_at)
       VALUES ($1, $2, $3, 1, 'DRAFT', NOW())`,
      [ids.courseVersionId, tenantId, ids.courseId],
    );

    await client.query(
      `INSERT INTO course_modules (id, tenant_id, course_version_id, title, sort_order, updated_at)
       VALUES ($1, $2, $3, 'Module 1', 0, NOW())`,
      [ids.courseModuleId, tenantId, ids.courseVersionId],
    );

    await client.query(
      `INSERT INTO lessons (id, tenant_id, course_module_id, title, sort_order, status, updated_at)
       VALUES ($1, $2, $3, 'Lesson 1', 0, 'DRAFT', NOW())`,
      [ids.lessonId, tenantId, ids.courseModuleId],
    );

    await client.query(
      `INSERT INTO cohorts (id, tenant_id, course_id, course_version_id, name, status, updated_at)
       VALUES ($1, $2, $3, $4, 'Cohort A', 'OPEN', NOW())`,
      [ids.cohortId, tenantId, ids.courseId, ids.courseVersionId],
    );

    await client.query(
      `INSERT INTO enrollments (id, tenant_id, cohort_id, membership_id, course_version_id, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW())`,
      [ids.enrollmentId, tenantId, ids.cohortId, ids.membershipId, ids.courseVersionId],
    );

    await client.query(
      `INSERT INTO assessments (id, tenant_id, title, status, updated_at)
       VALUES ($1, $2, 'Assessment', 'DRAFT', NOW())`,
      [ids.assessmentId, tenantId],
    );

    await client.query(
      `INSERT INTO questions (id, tenant_id, stem, type, points, updated_at)
       VALUES ($1, $2, 'Question?', 'SINGLE_CHOICE', 1, NOW())`,
      [ids.questionId, tenantId],
    );

    await client.query(
      `INSERT INTO assessment_questions (id, tenant_id, assessment_id, question_id, sort_order)
       VALUES ($1, $2, $3, $4, 0)`,
      [randomUUID(), tenantId, ids.assessmentId, ids.questionId],
    );
  });

  await client.end();

  return { tenantId, userId, ...ids };
}

export async function cleanupTenant(tenantId: string): Promise<void> {
  const client = createClient(MIGRATION_DATABASE_URL);
  await client.connect();
  await client.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
  await client.end();
}
