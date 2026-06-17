-- Migration: Add stats JSONB column to public.xl_leaderboard_meta for dashboard statistics
ALTER TABLE public.xl_leaderboard_meta ADD COLUMN IF NOT EXISTS stats JSONB;
