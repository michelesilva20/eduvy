-- RLS for lesson_contents (Gate 2)

ALTER TABLE lesson_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_contents FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_contents_tenant_isolation ON lesson_contents;
CREATE POLICY lesson_contents_tenant_isolation ON lesson_contents
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
