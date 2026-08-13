-- Assessment Engine Gate 10 — Cohort assessment assignments

CREATE TYPE "ResultVisibility" AS ENUM (
  'IMMEDIATE',
  'AFTER_SUBMISSION',
  'AFTER_DEADLINE',
  'MANUAL'
);

CREATE TABLE "assessment_assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "cohort_id" UUID NOT NULL,
    "lesson_id" UUID,
    "available_from" TIMESTAMPTZ(6),
    "available_until" TIMESTAMPTZ(6),
    "attempts_allowed" INTEGER,
    "time_limit_minutes" INTEGER,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "result_visibility" "ResultVisibility" NOT NULL DEFAULT 'AFTER_SUBMISSION',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assessment_assignments_tenant_id_id_key"
  ON "assessment_assignments"("tenant_id", "id");

CREATE UNIQUE INDEX "assessment_assignments_tenant_assessment_cohort_key"
  ON "assessment_assignments"("tenant_id", "assessment_id", "cohort_id");

CREATE INDEX "assessment_assignments_tenant_id_cohort_id_is_active_idx"
  ON "assessment_assignments"("tenant_id", "cohort_id", "is_active");

CREATE INDEX "assessment_assignments_tenant_id_assessment_id_idx"
  ON "assessment_assignments"("tenant_id", "assessment_id");

ALTER TABLE "assessment_assignments" ADD CONSTRAINT "assessment_assignments_assessment_fkey"
  FOREIGN KEY ("tenant_id", "assessment_id")
  REFERENCES "assessments"("tenant_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "assessment_assignments" ADD CONSTRAINT "assessment_assignments_cohort_fkey"
  FOREIGN KEY ("tenant_id", "cohort_id")
  REFERENCES "cohorts"("tenant_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "assessment_assignments" ADD CONSTRAINT "assessment_assignments_lesson_fkey"
  FOREIGN KEY ("tenant_id", "lesson_id")
  REFERENCES "lessons"("tenant_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "assessment_assignments" ADD CONSTRAINT "assessment_assignments_attempts_allowed_positive"
  CHECK ("attempts_allowed" IS NULL OR "attempts_allowed" >= 1);

ALTER TABLE "assessment_assignments" ADD CONSTRAINT "assessment_assignments_time_limit_positive"
  CHECK ("time_limit_minutes" IS NULL OR "time_limit_minutes" >= 1);

ALTER TABLE "assessment_assignments" ADD CONSTRAINT "assessment_assignments_window_order"
  CHECK (
    "available_from" IS NULL
    OR "available_until" IS NULL
    OR "available_from" <= "available_until"
  );

ALTER TABLE "assessment_attempts" ADD COLUMN "assignment_id" UUID;

CREATE INDEX "assessment_attempts_tenant_id_assignment_id_membership_id_idx"
  ON "assessment_attempts"("tenant_id", "assignment_id", "membership_id");

ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_assignment_fkey"
  FOREIGN KEY ("tenant_id", "assignment_id")
  REFERENCES "assessment_assignments"("tenant_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- One in-progress attempt per assignment/member (when assignment is present)
CREATE UNIQUE INDEX "assessment_attempts_one_in_progress_per_assignment_member"
  ON "assessment_attempts"("tenant_id", "assignment_id", "membership_id")
  WHERE "status" = 'IN_PROGRESS' AND "assignment_id" IS NOT NULL;
