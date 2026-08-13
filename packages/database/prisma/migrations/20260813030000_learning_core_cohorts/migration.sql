-- Learning Core Gate 4 — Cohort enrichment + CohortInstructor

CREATE TYPE "CohortStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ARCHIVED');
CREATE TYPE "CohortInstructorRole" AS ENUM ('LEAD', 'ASSISTANT', 'TUTOR');

-- Clear legacy stub rows (schema was incomplete before Gate 4)
DELETE FROM "enrollments";
DELETE FROM "cohorts";

ALTER TABLE "cohorts" ADD COLUMN "course_id" UUID NOT NULL;
ALTER TABLE "cohorts" ADD COLUMN "course_version_id" UUID NOT NULL;
ALTER TABLE "cohorts" ADD COLUMN "enrollment_start_at" TIMESTAMPTZ(6);
ALTER TABLE "cohorts" ADD COLUMN "enrollment_end_at" TIMESTAMPTZ(6);
ALTER TABLE "cohorts" ADD COLUMN "max_students" INTEGER;
ALTER TABLE "cohorts" ADD COLUMN "status" "CohortStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "cohorts" ADD COLUMN "created_by" UUID;

CREATE UNIQUE INDEX "cohorts_tenant_id_code_key" ON "cohorts"("tenant_id", "code");
CREATE INDEX "cohorts_tenant_id_status_idx" ON "cohorts"("tenant_id", "status");
CREATE INDEX "cohorts_tenant_id_course_id_idx" ON "cohorts"("tenant_id", "course_id");
CREATE INDEX "cohorts_tenant_id_created_at_idx" ON "cohorts"("tenant_id", "created_at" DESC);

ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_tenant_id_course_id_fkey"
  FOREIGN KEY ("tenant_id", "course_id") REFERENCES "courses"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_tenant_id_course_version_id_fkey"
  FOREIGN KEY ("tenant_id", "course_version_id") REFERENCES "course_versions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_max_students_positive"
  CHECK ("max_students" IS NULL OR "max_students" > 0);

CREATE TABLE "cohort_instructors" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "cohort_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "role" "CohortInstructorRole" NOT NULL DEFAULT 'LEAD',
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,

    CONSTRAINT "cohort_instructors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cohort_instructors_tenant_id_id_key" ON "cohort_instructors"("tenant_id", "id");
CREATE UNIQUE INDEX "cohort_instructors_tenant_id_cohort_id_membership_id_key" ON "cohort_instructors"("tenant_id", "cohort_id", "membership_id");
CREATE INDEX "cohort_instructors_tenant_id_cohort_id_idx" ON "cohort_instructors"("tenant_id", "cohort_id");

ALTER TABLE "cohort_instructors" ADD CONSTRAINT "cohort_instructors_tenant_id_cohort_id_fkey"
  FOREIGN KEY ("tenant_id", "cohort_id") REFERENCES "cohorts"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
