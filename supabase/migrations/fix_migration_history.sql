-- Fix: Mark old migrations as applied in Supabase's internal tracking table.
-- Run this in Supabase Dashboard → SQL Editor if you see:
-- "Remote migration versions not found in local migrations directory"
--
-- This tells Supabase CLI that these migrations were already applied manually,
-- so it stops complaining about the mismatch.

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20260601000001', '001_schema', ARRAY['-- applied manually']),
  ('20260601000002', '002_new_predictions', ARRAY['-- applied manually']),
  ('20260601000003', '003_security_hardening', ARRAY['-- applied manually']),
  ('20260601000004', '004_unique_constraints_and_rpc_security', ARRAY['-- applied manually'])
ON CONFLICT (version) DO NOTHING;
