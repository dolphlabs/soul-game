-- Create game sessions table to track individual games
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  level_reached INTEGER NOT NULL DEFAULT 1,
  colors_matched INTEGER NOT NULL DEFAULT 0,
  perfect_matches INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  time_played INTEGER NOT NULL DEFAULT 0, -- in seconds
  game_mode TEXT NOT NULL DEFAULT 'classic', -- classic, speed, endless, challenge
  difficulty TEXT NOT NULL DEFAULT 'normal', -- easy, normal, hard, expert
  power_ups_used JSONB DEFAULT '[]',
  bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_score ON game_sessions(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_mode ON game_sessions(game_mode);
CREATE INDEX IF NOT EXISTS idx_game_sessions_completed_at ON game_sessions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_score ON game_sessions(user_id, score DESC);
