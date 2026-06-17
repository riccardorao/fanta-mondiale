-- Migration: Add predicted_winner to public.xl_leaderboard for front-end rendering
ALTER TABLE public.xl_leaderboard ADD COLUMN IF NOT EXISTS predicted_winner TEXT;
