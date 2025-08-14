-- Insert initial achievements
INSERT INTO achievements (name, description, category, requirement_type, requirement_value, reward_xp, reward_coins) VALUES
('First Steps', 'Complete your first game', 'games', 'games_played', 1, 50, 10),
('Century Club', 'Score 100 points in a single game', 'score', 'score_threshold', 100, 100, 25),
('High Roller', 'Score 500 points in a single game', 'score', 'score_threshold', 500, 250, 50),
('Master Player', 'Score 1000 points in a single game', 'score', 'score_threshold', 1000, 500, 100),
('Streak Master', 'Get a 10-color streak', 'streak', 'streak_count', 10, 200, 40),
('Perfect Vision', 'Get a 25-color streak', 'streak', 'streak_count', 25, 500, 100),
('Dedicated Player', 'Play 50 games', 'games', 'games_played', 50, 300, 75),
('Game Addict', 'Play 200 games', 'games', 'games_played', 200, 750, 200),
('Speed Demon', 'Complete a game in under 60 seconds', 'special', 'special_condition', 60, 400, 80),
('Perfectionist', 'Get 100% accuracy in a game', 'special', 'special_condition', 100, 600, 150);

-- Insert initial power-ups
INSERT INTO power_ups (name, description, effect_type, effect_value, duration, cost_coins, cost_gems, rarity, icon) VALUES
('Time Freeze', 'Freeze the timer for 5 seconds', 'time_freeze', 5.0, 5, 50, 0, 'common', '⏸️'),
('Score Boost', 'Double your score for 10 seconds', 'score_multiplier', 2.0, 10, 75, 0, 'common', '⚡'),
('Hint Helper', 'Highlight the correct color', 'hint', 1.0, null, 25, 0, 'common', '💡'),
('Mega Multiplier', 'Triple your score for 15 seconds', 'score_multiplier', 3.0, 15, 0, 5, 'rare', '🚀'),
('Time Warp', 'Freeze timer for 10 seconds', 'time_freeze', 10.0, 10, 0, 3, 'rare', '⏰'),
('Perfect Vision', 'Show next 3 colors', 'hint', 3.0, null, 0, 8, 'epic', '👁️');
