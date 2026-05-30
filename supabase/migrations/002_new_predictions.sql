-- Migration 002: goalscorer & final standings predictions, leaderboard columns

-- Top goalscorer prediction (one per user)
CREATE TABLE IF NOT EXISTS goalscorer_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT goalscorer_predictions_user_unique UNIQUE (user_id)
);

-- Final standings prediction: predict top 4 in order
CREATE TABLE IF NOT EXISTS standings_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_team_id  UUID REFERENCES teams(id),
  second_team_id UUID REFERENCES teams(id),
  third_team_id  UUID REFERENCES teams(id),
  fourth_team_id UUID REFERENCES teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT standings_predictions_user_unique UNIQUE (user_id)
);

-- RLS
ALTER TABLE goalscorer_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goalscorer prediction"
  ON goalscorer_predictions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all goalscorer predictions"
  ON goalscorer_predictions FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own standings prediction"
  ON standings_predictions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all standings predictions"
  ON standings_predictions FOR SELECT
  USING (true);

-- Add new scoring columns to leaderboard
ALTER TABLE leaderboard
  ADD COLUMN IF NOT EXISTS exact_score_points    INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS group_position_points INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wrong_position_points INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS standings_points      INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS goalscorer_points     INT NOT NULL DEFAULT 0;

-- Updated auto-insert trigger for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, name, surname)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'surname', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO leaderboard (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
