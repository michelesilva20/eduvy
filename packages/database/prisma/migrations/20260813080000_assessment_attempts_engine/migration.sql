-- Assessment Engine Gate 9 — Attempts lifecycle fields + concurrency guard

ALTER TYPE "AttemptStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

ALTER TABLE "assessment_attempts" ADD COLUMN "enrollment_id" UUID;
ALTER TABLE "assessment_attempts" ADD COLUMN "attempt_number" INTEGER;
ALTER TABLE "assessment_attempts" ADD COLUMN "expires_at" TIMESTAMPTZ(6);
ALTER TABLE "assessment_attempts" ADD COLUMN "graded_at" TIMESTAMPTZ(6);
ALTER TABLE "assessment_attempts" ADD COLUMN "score" INTEGER;
ALTER TABLE "assessment_attempts" ADD COLUMN "max_score" INTEGER;

-- Backfill attempt numbers for any pre-existing rows (schema-only foundation)
WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, assessment_id, membership_id
      ORDER BY started_at ASC, created_at ASC
    ) AS rn
  FROM "assessment_attempts"
)
UPDATE "assessment_attempts" a
SET "attempt_number" = numbered.rn
FROM numbered
WHERE a.id = numbered.id;

UPDATE "assessment_attempts"
SET "attempt_number" = 1
WHERE "attempt_number" IS NULL;

ALTER TABLE "assessment_attempts"
  ALTER COLUMN "attempt_number" SET NOT NULL;

ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_attempt_number_positive"
  CHECK ("attempt_number" >= 1);

ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_score_non_negative"
  CHECK ("score" IS NULL OR "score" >= 0);

ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_max_score_non_negative"
  CHECK ("max_score" IS NULL OR "max_score" >= 0);

CREATE UNIQUE INDEX "assessment_attempts_tenant_assessment_membership_number_key"
  ON "assessment_attempts"("tenant_id", "assessment_id", "membership_id", "attempt_number");

-- Only one in-progress attempt per student/assessment (concurrency / double-click)
CREATE UNIQUE INDEX "assessment_attempts_one_in_progress_per_member"
  ON "assessment_attempts"("tenant_id", "assessment_id", "membership_id")
  WHERE "status" = 'IN_PROGRESS';

ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_tenant_id_enrollment_id_fkey"
  FOREIGN KEY ("tenant_id", "enrollment_id")
  REFERENCES "enrollments"("tenant_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
