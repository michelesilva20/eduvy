-- Gate 8.5 — Fail-closed when app.tenant_id is unset (nullable tenant_id tables)

DROP POLICY IF EXISTS audit_logs_tenant_isolation ON audit_logs;
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
  FOR ALL
  USING (
    NULLIF(current_setting('app.tenant_id', true), '') IS NOT NULL
    AND (
      tenant_id IS NULL
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.tenant_id', true), '') IS NOT NULL
    AND (
      tenant_id IS NULL
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
  );

DROP POLICY IF EXISTS outbox_events_tenant_isolation ON outbox_events;
CREATE POLICY outbox_events_tenant_isolation ON outbox_events
  FOR ALL
  USING (
    NULLIF(current_setting('app.tenant_id', true), '') IS NOT NULL
    AND (
      tenant_id IS NULL
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.tenant_id', true), '') IS NOT NULL
    AND (
      tenant_id IS NULL
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
  );

DROP POLICY IF EXISTS dead_letter_jobs_tenant_isolation ON dead_letter_jobs;
CREATE POLICY dead_letter_jobs_tenant_isolation ON dead_letter_jobs
  FOR ALL
  USING (
    NULLIF(current_setting('app.tenant_id', true), '') IS NOT NULL
    AND (
      tenant_id IS NULL
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.tenant_id', true), '') IS NOT NULL
    AND (
      tenant_id IS NULL
      OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
  );
