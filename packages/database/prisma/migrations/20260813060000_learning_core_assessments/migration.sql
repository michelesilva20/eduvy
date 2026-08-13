-- Learning Core Gate 8 — Assessment foundation

CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_TEXT');
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'CANCELLED');

CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "stem" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "options" JSONB,
    "correct_answer" JSONB,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "questions_tenant_id_id_key" ON "questions"("tenant_id", "id");
CREATE INDEX "questions_tenant_id_type_idx" ON "questions"("tenant_id", "type");
CREATE INDEX "questions_tenant_id_created_at_idx" ON "questions"("tenant_id", "created_at" DESC);

ALTER TABLE "questions" ADD CONSTRAINT "questions_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "questions" ADD CONSTRAINT "questions_points_non_negative"
  CHECK ("points" >= 0);

CREATE TABLE "assessments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "passing_score" INTEGER,
    "max_attempts" INTEGER,
    "time_limit_minutes" INTEGER,
    "shuffle_questions" BOOLEAN NOT NULL DEFAULT false,
    "available_from" TIMESTAMPTZ(6),
    "available_until" TIMESTAMPTZ(6),
    "created_by" UUID,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assessments_tenant_id_id_key" ON "assessments"("tenant_id", "id");
CREATE INDEX "assessments_tenant_id_status_idx" ON "assessments"("tenant_id", "status");
CREATE INDEX "assessments_tenant_id_created_at_idx" ON "assessments"("tenant_id", "created_at" DESC);

ALTER TABLE "assessments" ADD CONSTRAINT "assessments_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "assessments" ADD CONSTRAINT "assessments_passing_score_range"
  CHECK ("passing_score" IS NULL OR ("passing_score" >= 0 AND "passing_score" <= 100));

ALTER TABLE "assessments" ADD CONSTRAINT "assessments_max_attempts_positive"
  CHECK ("max_attempts" IS NULL OR "max_attempts" >= 1);

ALTER TABLE "assessments" ADD CONSTRAINT "assessments_time_limit_positive"
  CHECK ("time_limit_minutes" IS NULL OR "time_limit_minutes" >= 1);

CREATE TABLE "assessment_questions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "points_override" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assessment_questions_tenant_id_id_key" ON "assessment_questions"("tenant_id", "id");
CREATE UNIQUE INDEX "assessment_questions_tenant_id_assessment_id_question_id_key"
  ON "assessment_questions"("tenant_id", "assessment_id", "question_id");
CREATE INDEX "assessment_questions_tenant_id_assessment_id_sort_order_idx"
  ON "assessment_questions"("tenant_id", "assessment_id", "sort_order");

ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_assessment_fkey"
  FOREIGN KEY ("tenant_id", "assessment_id") REFERENCES "assessments"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_question_fkey"
  FOREIGN KEY ("tenant_id", "question_id") REFERENCES "questions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_points_override_non_negative"
  CHECK ("points_override" IS NULL OR "points_override" >= 0);

CREATE TABLE "assessment_attempts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ(6),
    "score_percentage" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assessment_attempts_tenant_id_id_key" ON "assessment_attempts"("tenant_id", "id");
CREATE INDEX "assessment_attempts_tenant_id_assessment_id_membership_id_idx"
  ON "assessment_attempts"("tenant_id", "assessment_id", "membership_id");
CREATE INDEX "assessment_attempts_tenant_id_membership_id_status_idx"
  ON "assessment_attempts"("tenant_id", "membership_id", "status");

ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_assessment_fkey"
  FOREIGN KEY ("tenant_id", "assessment_id") REFERENCES "assessments"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_score_range"
  CHECK ("score_percentage" IS NULL OR ("score_percentage" >= 0 AND "score_percentage" <= 100));

CREATE TABLE "attempt_answers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "answer" JSONB,
    "is_correct" BOOLEAN,
    "points_awarded" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attempt_answers_tenant_id_id_key" ON "attempt_answers"("tenant_id", "id");
CREATE UNIQUE INDEX "attempt_answers_tenant_id_attempt_id_question_id_key"
  ON "attempt_answers"("tenant_id", "attempt_id", "question_id");

ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_fkey"
  FOREIGN KEY ("tenant_id", "attempt_id") REFERENCES "assessment_attempts"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_question_fkey"
  FOREIGN KEY ("tenant_id", "question_id") REFERENCES "questions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
