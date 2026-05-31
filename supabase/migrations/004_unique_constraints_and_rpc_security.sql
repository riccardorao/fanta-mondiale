-- Migration 004: unique constraints for idempotent seeding + RPC security hardening

-- ─── Data integrity: unique constraints ──────────────────────────────────────

-- team codes (MEX, BRA, …) are naturally unique in football
ALTER TABLE public.teams
  ADD CONSTRAINT IF NOT EXISTS teams_code_unique UNIQUE (code);

-- match_number drives the entire bracket engine — must be globally unique
ALTER TABLE public.matches
  ADD CONSTRAINT IF NOT EXISTS matches_number_unique UNIQUE (match_number);

-- ─── RPC security: revoke REST access from internal/trigger functions ─────────

-- handle_new_user is a trigger-only function; it must never be callable via /rpc
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- is_before_kickoff is called by RLS policies at DML time.
-- authenticated must retain EXECUTE (PostgreSQL evaluates the policy as the calling role).
-- anon has no insert/update/delete capability on prediction tables, so safe to revoke.
REVOKE EXECUTE ON FUNCTION public.is_before_kickoff(uuid) FROM anon;
