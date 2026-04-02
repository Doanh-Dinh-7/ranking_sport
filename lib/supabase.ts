import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  group_name: string;
  created_at: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  venue_id: string;
  scheduled_at: string;
  home_score: number | null;
  away_score: number | null;
  stage: string;
  status: string;
  bracket_slot?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Standing {
  id: string;
  team_id: string;
  group_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
  updated_at: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  team_id: string;
  event_type: string;
  player_name: string | null;
  minute: number | null;
  created_at: string;
}
