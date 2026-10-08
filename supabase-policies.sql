-- Run in Supabase SQL Editor. Create staff accounts in Supabase Auth first.
-- The public anon role cannot read or modify gym records.

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  existing_policy RECORD;
BEGIN
  FOR existing_policy IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('members', 'attendance', 'invoices')
      AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      existing_policy.policyname,
      existing_policy.tablename
    );
  END LOOP;
END
$$;

REVOKE ALL ON TABLE public.members, public.attendance, public.invoices FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.members, public.attendance, public.invoices
  TO authenticated;

DROP POLICY IF EXISTS "staff_manage_members" ON public.members;
CREATE POLICY "staff_manage_members" ON public.members
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "staff_manage_attendance" ON public.attendance;
CREATE POLICY "staff_manage_attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "staff_manage_invoices" ON public.invoices;
CREATE POLICY "staff_manage_invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
