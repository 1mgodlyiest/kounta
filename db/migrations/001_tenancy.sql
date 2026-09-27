-- Kounta M0 (job 0): tenancy foundation — business_id cols, RLS policies, session binding.
-- Postgres 15+. Fail closed: RLS enabled, no public bypass, FORCE RLS so owners obey too.
-- Session binding: app.current_business_id GUC set per-connection after auth, e.g.
--   SET app.current_business_id = '<uuid>';
-- All tenant tables carry business_id UUID NOT NULL REFERENCES businesses(id).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Session helper: NULL when unauthenticated/malformed -> policies match zero rows (fail closed).
CREATE OR REPLACE FUNCTION current_business_id() RETURNS uuid
  LANGUAGE plpgsql STABLE AS
$$
DECLARE
  raw text := NULLIF(current_setting('app.current_business_id', true), '');
BEGIN
  IF raw IS NULL THEN RETURN NULL; END IF;
  BEGIN
    RETURN raw::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN NULL;
  END;
END;
$$;

-- Root tenant table. No business_id here by definition; access gated in app layer.
CREATE TABLE IF NOT EXISTS businesses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Owner login per business, bound at session.
CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email       citext NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_business_id_idx ON users (business_id);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_tenant_isolation ON users;
CREATE POLICY users_tenant_isolation ON users
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- Template for every future tenant table (jobs 1+): copy this pattern.
--   business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
--   ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE <t> FORCE ROW LEVEL SECURITY;
--   CREATE POLICY <t>_tenant_isolation ON <t>
--     USING (business_id = current_business_id())
--     WITH CHECK (business_id = current_business_id());
-- Gate T0: 2 businesses; A cannot SELECT B rows; unset GUC returns zero rows.
