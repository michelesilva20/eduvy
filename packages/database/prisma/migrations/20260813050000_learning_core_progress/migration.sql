-- Learning Core Gate 6 — LessonProgress

CREATE TYPE "LessonProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE "lesson_progress" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "status" "LessonProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress_percentage" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "last_access_at" TIMESTAMPTZ(6),
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lesson_progress_tenant_id_id_key" ON "lesson_progress"("tenant_id", "id");
CREATE UNIQUE INDEX "lesson_progress_tenant_id_enrollment_id_lesson_id_key" ON "lesson_progress"("tenant_id", "enrollment_id", "lesson_id");
CREATE INDEX "lesson_progress_tenant_id_enrollment_id_status_idx" ON "lesson_progress"("tenant_id", "enrollment_id", "status");

ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_tenant_id_enrollment_id_fkey"
  FOREIGN KEY ("tenant_id", "enrollment_id") REFERENCES "enrollments"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_tenant_id_lesson_id_fkey"
  FOREIGN KEY ("tenant_id", "lesson_id") REFERENCES "lessons"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_percentage_range"
  CHECK ("progress_percentage" >= 0 AND "progress_percentage" <= 100);

ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_time_spent_non_negative"
  CHECK ("time_spent_seconds" >= 0);
