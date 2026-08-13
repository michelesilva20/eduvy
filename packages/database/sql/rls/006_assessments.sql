-- RLS for assessment foundation tables (Gate 8)

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS questions_tenant_isolation ON questions;
CREATE POLICY questions_tenant_isolation ON questions
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessments_tenant_isolation ON assessments;
CREATE POLICY assessments_tenant_isolation ON assessments
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessment_questions_tenant_isolation ON assessment_questions;
CREATE POLICY assessment_questions_tenant_isolation ON assessment_questions
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessment_attempts_tenant_isolation ON assessment_attempts;
CREATE POLICY assessment_attempts_tenant_isolation ON assessment_attempts
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS attempt_answers_tenant_isolation ON attempt_answers;
CREATE POLICY attempt_answers_tenant_isolation ON attempt_answers
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
