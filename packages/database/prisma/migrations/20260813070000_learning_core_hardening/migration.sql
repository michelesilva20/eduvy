-- Assessment Engine Gate 8.5 — Learning Core integrity hardening

-- Course version must belong to the declared course (cohort consistency)
CREATE UNIQUE INDEX "course_versions_tenant_id_course_id_id_key"
  ON "course_versions"("tenant_id", "course_id", "id");

ALTER TABLE "cohorts" DROP CONSTRAINT IF EXISTS "cohorts_tenant_id_course_version_id_fkey";

ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_course_version_belongs_to_course_fkey"
  FOREIGN KEY ("tenant_id", "course_id", "course_version_id")
  REFERENCES "course_versions"("tenant_id", "course_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Cross-tenant membership references
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_tenant_id_membership_id_fkey"
  FOREIGN KEY ("tenant_id", "membership_id")
  REFERENCES "memberships"("tenant_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cohort_instructors" ADD CONSTRAINT "cohort_instructors_tenant_id_membership_id_fkey"
  FOREIGN KEY ("tenant_id", "membership_id")
  REFERENCES "memberships"("tenant_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_tenant_id_membership_id_fkey"
  FOREIGN KEY ("tenant_id", "membership_id")
  REFERENCES "memberships"("tenant_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Attempt answer scoring bounds
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_points_awarded_non_negative"
  CHECK ("points_awarded" IS NULL OR "points_awarded" >= 0);
