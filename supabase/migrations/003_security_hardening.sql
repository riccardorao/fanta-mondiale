-- Migration 003: kick-off enforcement + RLS hardening

-- ─── Helper function ────────────────────────────────────────────────────────

-- Returns TRUE when the match has not yet kicked off (NOW() < scheduled_at).
-- If scheduled_at is NULL we treat it as "not yet scheduled" → allow writes.
-- SECURITY DEFINER so RLS policies can call it without needing SELECT on matches.
CREATE OR REPLACE FUNCTION public.is_before_kickoff(match_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NOW() < scheduled_at,
    TRUE  -- NULL scheduled_at → allow writes until explicitly scheduled
  )
  FROM public.matches
  WHERE id = match_id;
$$;

-- ─── Index ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS matches_scheduled_at_idx ON public.matches (scheduled_at);

-- ─── group_predictions: drop old policies, recreate with kick-off guard ──────

DROP POLICY IF EXISTS "Insert own group prediction"   ON public.group_predictions;
DROP POLICY IF EXISTS "Update own group prediction"   ON public.group_predictions;
DROP POLICY IF EXISTS "Delete own group prediction"   ON public.group_predictions;

-- INSERT: only own rows, only before kick-off
CREATE POLICY "Insert own group prediction"
  ON public.group_predictions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND is_before_kickoff(match_id)
  );

-- UPDATE: only own rows, only before kick-off
CREATE POLICY "Update own group prediction"
  ON public.group_predictions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_before_kickoff(match_id)
  );

-- DELETE: only own rows, only before kick-off
CREATE POLICY "Delete own group prediction"
  ON public.group_predictions
  FOR DELETE
  USING (
    auth.uid() = user_id
    AND is_before_kickoff(match_id)
  );

-- ─── bracket_predictions: drop old policies, recreate with kick-off guard ────

DROP POLICY IF EXISTS "Insert own bracket prediction"  ON public.bracket_predictions;
DROP POLICY IF EXISTS "Update own bracket prediction"  ON public.bracket_predictions;
DROP POLICY IF EXISTS "Delete own bracket prediction"  ON public.bracket_predictions;

-- INSERT: only own rows, only before kick-off
CREATE POLICY "Insert own bracket prediction"
  ON public.bracket_predictions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND is_before_kickoff(match_id)
  );

-- UPDATE: only own rows, only before kick-off
CREATE POLICY "Update own bracket prediction"
  ON public.bracket_predictions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_before_kickoff(match_id)
  );

-- DELETE: only own rows, only before kick-off
CREATE POLICY "Delete own bracket prediction"
  ON public.bracket_predictions
  FOR DELETE
  USING (
    auth.uid() = user_id
    AND is_before_kickoff(match_id)
  );
