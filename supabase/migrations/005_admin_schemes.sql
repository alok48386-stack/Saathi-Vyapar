-- ============================================================
-- Migration: 005_admin_schemes.sql
-- Description: Admin role support + scheme catalogue management columns.
--
-- Adds everything the /admin/schemes panel needs:
--   1. Guarantees 'admin' is an accepted value on users.role
--   2. Adds the curation columns the admin form edits
--      (sponsoring_body, documents_required, last_verified_date, active)
--   3. A SECURITY DEFINER is_admin() helper so RLS policies can check the
--      requester's role without recursing into users' own SELECT policy
--   4. RLS policies letting admins read/write the scheme catalogue
--
-- Safe to re-run: every statement is idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- 1. users.role must accept 'admin'
-- ------------------------------------------------------------
-- 001_init.sql and schema.sql already list 'admin', but a database that was
-- created from an older dump may not. Dropping and re-adding by the default
-- constraint name makes this deterministic either way.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('entrepreneur', 'facilitator', 'admin'));

-- ------------------------------------------------------------
-- 2. Scheme catalogue columns edited from the admin panel
-- ------------------------------------------------------------
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS description        TEXT;
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS benefit_summary    TEXT;
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS sponsoring_body    TEXT DEFAULT 'Government of India';
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS application_link   TEXT;
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS eligibility_rules  JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS documents_required TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS last_verified_date DATE;
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS active             BOOLEAN DEFAULT TRUE;
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS created_at         TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN public.schemes.documents_required IS
  'Checklist of documents an applicant must gather, shown in Yojana Kendra';
COMMENT ON COLUMN public.schemes.last_verified_date IS
  'Date an admin last confirmed the scheme terms against the sponsoring body''s site';

-- Keep updated_at fresh on admin edits (handle_updated_at is defined in schema.sql)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'handle_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS set_updated_at_schemes ON public.schemes;
    CREATE TRIGGER set_updated_at_schemes
      BEFORE UPDATE ON public.schemes FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 3. is_admin() helper
-- ------------------------------------------------------------
-- SECURITY DEFINER on purpose: a policy on public.users that queries
-- public.users would recurse. This runs as the function owner instead, so it
-- reads the role row directly. It only ever returns a boolean, never data.
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = uid AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- ------------------------------------------------------------
-- 4. RLS — admins curate the scheme catalogue
-- ------------------------------------------------------------
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;

-- Entrepreneurs keep read access to live schemes; admins additionally see
-- drafts/retired rows (active = FALSE) so they can bring them back.
DROP POLICY IF EXISTS "Admins can read all schemes" ON public.schemes;
CREATE POLICY "Admins can read all schemes"
  ON public.schemes FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert schemes" ON public.schemes;
CREATE POLICY "Admins can insert schemes"
  ON public.schemes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update schemes" ON public.schemes;
CREATE POLICY "Admins can update schemes"
  ON public.schemes FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete schemes" ON public.schemes;
CREATE POLICY "Admins can delete schemes"
  ON public.schemes FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Admins need to be able to read the users table to find other admins and to
-- audit the catalogue's audience.
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- 5. Promoting the first admin (manual step)
-- ------------------------------------------------------------
-- Role changes are deliberately NOT exposed through the app. Promote an
-- account by hand in the SQL editor:
--
--   UPDATE public.users SET role = 'admin' WHERE email = 'you@example.com';
