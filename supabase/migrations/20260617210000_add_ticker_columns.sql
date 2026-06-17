-- Add ticker_text and next_game_text columns to xl_leaderboard_meta
-- These are updated by fetch_results.py and read by the frontend

ALTER TABLE xl_leaderboard_meta
  ADD COLUMN IF NOT EXISTS ticker_text TEXT,
  ADD COLUMN IF NOT EXISTS next_game_text TEXT;
