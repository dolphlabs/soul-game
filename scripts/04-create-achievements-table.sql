-- Create achievements and badges system
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  category TEXT NOT NULL, -- 'score', 'streak', 'games', 'special'
  requirement_type TEXT NOT NULL, -- 'score_threshold', 'streak_count', 'games_played', 'special_condition'
  requirement_value INTEGER,
  reward_xp INTEGER DEFAULT 0,
  reward_coins INTEGER DEFAULT 0,
  is_secret BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE
);

-- Create unique constraint and indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_achievements_unique 
ON user_achievements(user_id, achievement_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(user_id, is_completed);
