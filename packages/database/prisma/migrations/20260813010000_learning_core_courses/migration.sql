-- Learning Core 1.0 — Course domain enrichment
-- Extends courses with metadata + explicit lifecycle status.
-- Existing string status values are migrated to CourseStatus.

CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "CourseVisibility" AS ENUM ('PRIVATE', 'TENANT', 'UNLISTED');

ALTER TABLE "courses" ADD COLUMN "description" TEXT;
ALTER TABLE "courses" ADD COLUMN "short_description" VARCHAR(500);
ALTER TABLE "courses" ADD COLUMN "category" TEXT;
ALTER TABLE "courses" ADD COLUMN "workload_minutes" INTEGER;
ALTER TABLE "courses" ADD COLUMN "thumbnail_file_id" UUID;
ALTER TABLE "courses" ADD COLUMN "visibility" "CourseVisibility" NOT NULL DEFAULT 'TENANT';

-- Temporary column for status migration
ALTER TABLE "courses" ADD COLUMN "status_new" "CourseStatus";

UPDATE "courses"
SET "status_new" = CASE
  WHEN lower("status") IN ('published', 'active') THEN 'PUBLISHED'::"CourseStatus"
  WHEN lower("status") IN ('review', 'in_review') THEN 'IN_REVIEW'::"CourseStatus"
  WHEN lower("status") IN ('archived') THEN 'ARCHIVED'::"CourseStatus"
  ELSE 'DRAFT'::"CourseStatus"
END;

ALTER TABLE "courses" DROP COLUMN "status";
ALTER TABLE "courses" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "courses" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "courses" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"CourseStatus";

ALTER TABLE "courses" ADD CONSTRAINT "courses_workload_minutes_non_negative"
  CHECK ("workload_minutes" IS NULL OR "workload_minutes" >= 0);

CREATE INDEX "courses_tenant_id_status_idx" ON "courses"("tenant_id", "status");
CREATE INDEX "courses_tenant_id_created_at_idx" ON "courses"("tenant_id", "created_at" DESC);
CREATE INDEX "courses_tenant_id_owner_id_idx" ON "courses"("tenant_id", "owner_id");
