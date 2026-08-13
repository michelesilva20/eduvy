-- Allow a user to list their own memberships across tenants (control-plane read).
-- Used by GET /tenants/mine with set_config('app.user_id', ...).
-- PERMISSIVE policies are OR'd with memberships_tenant_isolation.

DROP POLICY IF EXISTS memberships_own_user_select ON memberships;
CREATE POLICY memberships_own_user_select ON memberships
  FOR SELECT
  USING (
    user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  );
