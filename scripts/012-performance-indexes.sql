-- API latency optimization indexes
-- Safe to run multiple times.

create index if not exists idx_matches_status_stage_scheduled_at
  on public.matches (status, stage, scheduled_at desc);

create index if not exists idx_matches_stage_scheduled_at
  on public.matches (stage, scheduled_at desc);

create index if not exists idx_standings_group_points_goaldiff
  on public.standings (group_name, points desc, goals_against asc, goals_for desc);

create index if not exists idx_match_events_match_minute
  on public.match_events (match_id, minute asc);
