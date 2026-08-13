import { describe, expect, it, beforeAll } from "@jest/globals";
import { randomUUID } from "node:crypto";
import {
  APP_DATABASE_URL,
  createClient,
  expectQueryError,
  withTenant,
} from "./helpers/db-client";
import {
  seedTenantLearningCore,
  type TenantFixture,
} from "./helpers/learning-core-fixtures";

const describeIf = APP_DATABASE_URL ? describe : describe.skip;

describeIf("Learning Core cross-tenant integrity", () => {
  let tenantA: TenantFixture;
  let tenantB: TenantFixture;

  beforeAll(async () => {
    tenantA = await seedTenantLearningCore("lc-a");
    tenantB = await seedTenantLearningCore("lc-b");
  }, 120_000);

  it("denies INSERT lesson referencing course module from another tenant (FK)", async () => {
    const client = createClient();
    await client.connect();
    const lessonId = randomUUID();

    await withTenant(client, tenantA.tenantId, async () => {
      await expectQueryError(
        () =>
          client.query(
            `INSERT INTO lessons (id, tenant_id, course_module_id, title, sort_order, status, updated_at)
             VALUES ($1, $2, $3, 'Cross tenant lesson', 1, 'DRAFT', NOW())`,
            [lessonId, tenantA.tenantId, tenantB.courseModuleId],
          ),
        "23503",
      );
    });

    await client.end();
  });

  it("denies INSERT lesson_content referencing lesson from another tenant (FK)", async () => {
    const client = createClient();
    await client.connect();
    const contentId = randomUUID();

    await withTenant(client, tenantA.tenantId, async () => {
      await expectQueryError(
        () =>
          client.query(
            `INSERT INTO lesson_contents (id, tenant_id, lesson_id, type, sort_order, updated_at)
             VALUES ($1, $2, $3, 'RICH_TEXT', 0, NOW())`,
            [contentId, tenantA.tenantId, tenantB.lessonId],
          ),
        "23503",
      );
    });

    await client.end();
  });

  it("denies UPDATE lesson to point at module from another tenant (FK)", async () => {
    const client = createClient();
    await client.connect();

    await withTenant(client, tenantA.tenantId, async () => {
      await expectQueryError(
        () =>
          client.query(
            `UPDATE lessons SET course_module_id = $1, updated_at = NOW() WHERE id = $2`,
            [tenantB.courseModuleId, tenantA.lessonId],
          ),
        "23503",
      );
    });

    await client.end();
  });

  it("denies enrollment with membership from another tenant (FK)", async () => {
    const client = createClient();
    await client.connect();
    const enrollmentId = randomUUID();

    await withTenant(client, tenantA.tenantId, async () => {
      await expectQueryError(
        () =>
          client.query(
            `INSERT INTO enrollments (id, tenant_id, cohort_id, membership_id, course_version_id, status, updated_at)
             VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW())`,
            [
              enrollmentId,
              tenantA.tenantId,
              tenantA.cohortId,
              tenantB.membershipId,
              tenantA.courseVersionId,
            ],
          ),
        "23503",
      );
    });

    await client.end();
  });

  it("denies lesson_progress for enrollment/lesson from another tenant (FK)", async () => {
    const client = createClient();
    await client.connect();
    const progressId = randomUUID();

    await withTenant(client, tenantA.tenantId, async () => {
      await expectQueryError(
        () =>
          client.query(
            `INSERT INTO lesson_progress (id, tenant_id, enrollment_id, lesson_id, updated_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [progressId, tenantA.tenantId, tenantB.enrollmentId, tenantA.lessonId],
          ),
        "23503",
      );
    });

    await client.end();
  });

  it("denies cohort with course_version that does not belong to course_id (FK)", async () => {
    const client = createClient();
    await client.connect();
    const cohortId = randomUUID();

    await withTenant(client, tenantA.tenantId, async () => {
      await expectQueryError(
        () =>
          client.query(
            `INSERT INTO cohorts (id, tenant_id, course_id, course_version_id, name, status, updated_at)
             VALUES ($1, $2, $3, $4, 'Bad cohort', 'DRAFT', NOW())`,
            [cohortId, tenantA.tenantId, tenantA.courseId, tenantB.courseVersionId],
          ),
        "23503",
      );
    });

    await client.end();
  });

  it("denies assessment_question linking assessment and question across tenants (FK)", async () => {
    const client = createClient();
    await client.connect();
    const rowId = randomUUID();

    await withTenant(client, tenantA.tenantId, async () => {
      await expectQueryError(
        () =>
          client.query(
            `INSERT INTO assessment_questions (id, tenant_id, assessment_id, question_id, sort_order)
             VALUES ($1, $2, $3, $4, 1)`,
            [rowId, tenantA.tenantId, tenantA.assessmentId, tenantB.questionId],
          ),
        "23503",
      );
    });

    await client.end();
  });

  it("denies attempt_answer for attempt from another tenant (FK)", async () => {
    const client = createClient();
    await client.connect();

    const attemptId = randomUUID();
    await withTenant(client, tenantA.tenantId, async () => {
      await client.query(
        `INSERT INTO assessment_attempts (id, tenant_id, assessment_id, membership_id, status, updated_at)
         VALUES ($1, $2, $3, $4, 'IN_PROGRESS', NOW())`,
        [attemptId, tenantA.tenantId, tenantA.assessmentId, tenantA.membershipId],
      );
    });

    await withTenant(client, tenantA.tenantId, async () => {
      await expectQueryError(
        () =>
          client.query(
            `INSERT INTO attempt_answers (id, tenant_id, attempt_id, question_id, updated_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [randomUUID(), tenantA.tenantId, attemptId, tenantB.questionId],
          ),
        "23503",
      );
    });

    await client.end();
  });

  it("denies duplicate enrollment for same cohort/membership/course_version (unique)", async () => {
    const client = createClient();
    await client.connect();
    const duplicateId = randomUUID();

    await withTenant(client, tenantA.tenantId, async () => {
      await expectQueryError(
        () =>
          client.query(
            `INSERT INTO enrollments (id, tenant_id, cohort_id, membership_id, course_version_id, status, updated_at)
             VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW())`,
            [
              duplicateId,
              tenantA.tenantId,
              tenantA.cohortId,
              tenantA.membershipId,
              tenantA.courseVersionId,
            ],
          ),
        "23505",
      );
    });

    await client.end();
  });

  it("denies lesson_progress percentage outside 0-100 (check constraint)", async () => {
    const client = createClient();
    await client.connect();
    const progressId = randomUUID();

    await withTenant(client, tenantA.tenantId, async () => {
      await expectQueryError(
        () =>
          client.query(
            `INSERT INTO lesson_progress (id, tenant_id, enrollment_id, lesson_id, progress_percentage, updated_at)
             VALUES ($1, $2, $3, $4, 150, NOW())`,
            [progressId, tenantA.tenantId, tenantA.enrollmentId, tenantA.lessonId],
          ),
        "23514",
      );
    });

    await client.end();
  });

  it("RLS blocks tenant A from reading tenant B courses", async () => {
    const client = createClient();
    await client.connect();

    await withTenant(client, tenantA.tenantId, async () => {
      const result = await client.query(`SELECT id FROM courses WHERE id = $1`, [
        tenantB.courseId,
      ]);
      expect(result.rowCount).toBe(0);
    });

    await client.end();
  });

  it("RLS blocks tenant A from deleting tenant B lesson", async () => {
    const client = createClient();
    await client.connect();

    await withTenant(client, tenantA.tenantId, async () => {
      const result = await client.query(`DELETE FROM lessons WHERE id = $1`, [
        tenantB.lessonId,
      ]);
      expect(result.rowCount).toBe(0);
    });

    await withTenant(client, tenantB.tenantId, async () => {
      const stillThere = await client.query(`SELECT id FROM lessons WHERE id = $1`, [
        tenantB.lessonId,
      ]);
      expect(stillThere.rowCount).toBe(1);
    });

    await client.end();
  });
});
