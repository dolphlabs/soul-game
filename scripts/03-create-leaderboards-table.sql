-- Create leaderboards table for different ranking categories
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  leaderboard_type TEXT NOT NULL, -- 'global', 'country', 'state', 'daily', 'weekly', 'monthly'
  region TEXT, -- country code, state code, or null for global
  score INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  game_mode TEXT NOT NULL DEFAULT 'classic',
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboards_unique 
ON leaderboards(user_id, leaderboard_type, region, game_mode, period_start);

-- Create indexes for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboards_type_region ON leaderboards(leaderboard_type, region);
CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON leaderboards(leaderboard_type, region, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboards_score ON leaderboards(leaderboard_type, region, score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboards_period ON leaderboards(period_start, period_end);
