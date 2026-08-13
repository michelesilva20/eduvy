-- RLS for cohort_instructors (Gate 4)

ALTER TABLE cohort_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_instructors FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cohort_instructors_tenant_isolation ON cohort_instructors;
CREATE POLICY cohort_instructors_tenant_isolation ON cohort_instructors
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
