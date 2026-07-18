-- PostgreSQL roles for Eduvy (run after Prisma migrations, as migration/superuser role)

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'eduvy_migration') THEN
    CREATE ROLE eduvy_migration LOGIN PASSWORD 'eduvy_migration_dev';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'eduvy_app') THEN
    CREATE ROLE eduvy_app LOGIN PASSWORD 'eduvy_app_dev';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'eduvy_readonly') THEN
    CREATE ROLE eduvy_readonly LOGIN PASSWORD 'eduvy_readonly_dev';
  END IF;
END
$$;

-- Application role: no BYPASSRLS, no superuser, no schema DDL
ALTER ROLE eduvy_app NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;

GRANT CONNECT ON DATABASE eduvy TO eduvy_app, eduvy_readonly, eduvy_migration;
GRANT USAGE ON SCHEMA public TO eduvy_app, eduvy_readonly, eduvy_migration;

-- Migration role owns objects; app gets DML only
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO eduvy_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO eduvy_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO eduvy_readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO eduvy_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO eduvy_readonly;
