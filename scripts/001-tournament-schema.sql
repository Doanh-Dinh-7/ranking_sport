-- Football Tournament Platform — Database Schema
-- Scale: < 16 teams, 1 season, 1 admin
-- Execute this in Supabase SQL Editor

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  short_name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  group_name TEXT NOT NULL, -- 'A', 'B', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  lat FLOAT8,
  lng FLOAT8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  home_score INT DEFAULT NULL,
  away_score INT DEFAULT NULL,
  stage TEXT NOT NULL DEFAULT 'group', -- 'group', 'qf', 'sf', 'final'
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'finished'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create standings table (auto-managed by trigger)
CREATE TABLE IF NOT EXISTS standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  played INT DEFAULT 0,
  won INT DEFAULT 0,
  drawn INT DEFAULT 0,
  lost INT DEFAULT 0,
  goals_for INT DEFAULT 0,
  goals_against INT DEFAULT 0,
  points INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create match_events table (goals, cards, etc.)
CREATE TABLE IF NOT EXISTS match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'goal', 'own_goal', 'yellow', 'red'
  player_name TEXT,
  minute INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_scheduled_at ON matches(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_standings_group ON standings(group_name);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);

-- Enable RLS (Row Level Security) - all public read, admin write via API
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

-- Public read policy for all tables
CREATE POLICY "public_read" ON teams FOR SELECT USING (true);
CREATE POLICY "public_read" ON venues FOR SELECT USING (true);
CREATE POLICY "public_read" ON matches FOR SELECT USING (true);
CREATE POLICY "public_read" ON standings FOR SELECT USING (true);
CREATE POLICY "public_read" ON match_events FOR SELECT USING (true);

-- Write access controlled via API with hardcoded admin token (in Next.js)
-- Don't grant Supabase RLS write access - let Next.js API handle authorization
