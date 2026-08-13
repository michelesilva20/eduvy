-- Learning Core Gate 2 — CourseModule, Lesson, LessonContent enrichment

CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'TEXT', 'DOCUMENT', 'LINK');
CREATE TYPE "LessonStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "LessonContentType" AS ENUM ('RICH_TEXT', 'VIDEO', 'FILE', 'IMAGE', 'LINK', 'EMBED');

ALTER TABLE "course_modules" ADD COLUMN "description" TEXT;
ALTER TABLE "course_modules" ADD COLUMN "is_required" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "course_modules" ADD COLUMN "estimated_minutes" INTEGER;
ALTER TABLE "course_modules" ADD COLUMN "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "course_modules" ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "lessons" ADD COLUMN "description" TEXT;
ALTER TABLE "lessons" ADD COLUMN "type" "LessonType" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "lessons" ADD COLUMN "estimated_minutes" INTEGER;
ALTER TABLE "lessons" ADD COLUMN "is_required" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "lessons" ADD COLUMN "is_preview" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "lessons" ADD COLUMN "status" "LessonStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "lessons" ADD COLUMN "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "lessons" ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "lesson_contents" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "type" "LessonContentType" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "text_content" TEXT,
    "file_id" UUID,
    "external_url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_contents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lesson_contents_tenant_id_id_key" ON "lesson_contents"("tenant_id", "id");
CREATE INDEX "lesson_contents_tenant_id_lesson_id_sort_order_idx" ON "lesson_contents"("tenant_id", "lesson_id", "sort_order");
CREATE INDEX "course_modules_tenant_id_course_version_id_sort_order_idx" ON "course_modules"("tenant_id", "course_version_id", "sort_order");
CREATE INDEX "lessons_tenant_id_course_module_id_sort_order_idx" ON "lessons"("tenant_id", "course_module_id", "sort_order");

ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_tenant_id_lesson_id_fkey"
  FOREIGN KEY ("tenant_id", "lesson_id") REFERENCES "lessons"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_estimated_minutes_non_negative"
  CHECK ("estimated_minutes" IS NULL OR "estimated_minutes" >= 0);

ALTER TABLE "lessons" ADD CONSTRAINT "lessons_estimated_minutes_non_negative"
  CHECK ("estimated_minutes" IS NULL OR "estimated_minutes" >= 0);
