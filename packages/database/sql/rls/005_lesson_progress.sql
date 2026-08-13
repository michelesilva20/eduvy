-- RLS for lesson_progress (Gate 6)

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_progress_tenant_isolation ON lesson_progress;
CREATE POLICY lesson_progress_tenant_isolation ON lesson_progress
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
