-- Learning Core Gate 5 — Enrollment enrichment

CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- Normalize legacy free-text statuses before enum cast
UPDATE "enrollments"
SET "status" = CASE
  WHEN lower("status") IN ('active', 'enrolled') THEN 'ACTIVE'
  WHEN lower("status") IN ('pending') THEN 'PENDING'
  WHEN lower("status") IN ('completed', 'complete') THEN 'COMPLETED'
  WHEN lower("status") IN ('cancelled', 'canceled') THEN 'CANCELLED'
  WHEN lower("status") IN ('expired') THEN 'EXPIRED'
  ELSE 'ACTIVE'
END;

ALTER TABLE "enrollments"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "EnrollmentStatus" USING ("status"::"EnrollmentStatus"),
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

ALTER TABLE "enrollments" ADD COLUMN "started_at" TIMESTAMPTZ(6);
ALTER TABLE "enrollments" ADD COLUMN "completed_at" TIMESTAMPTZ(6);
ALTER TABLE "enrollments" ADD COLUMN "cancelled_at" TIMESTAMPTZ(6);
ALTER TABLE "enrollments" ADD COLUMN "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "enrollments" ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "enrollments_tenant_id_cohort_id_status_idx" ON "enrollments"("tenant_id", "cohort_id", "status");
CREATE INDEX "enrollments_tenant_id_membership_id_idx" ON "enrollments"("tenant_id", "membership_id");
