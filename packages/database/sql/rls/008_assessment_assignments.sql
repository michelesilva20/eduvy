-- RLS for assessment_assignments (Gate 10)

ALTER TABLE assessment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_assignments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessment_assignments_tenant_isolation ON assessment_assignments;
CREATE POLICY assessment_assignments_tenant_isolation ON assessment_assignments
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
