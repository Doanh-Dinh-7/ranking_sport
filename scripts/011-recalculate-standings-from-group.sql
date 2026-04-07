-- Tính lại bảng xếp hạng CHỈ từ trận vòng bảng (stage = 'group', finished).

BEGIN;

UPDATE standings s
SET
  played = (
    SELECT COUNT(*)::int
    FROM matches m
    WHERE m.status = 'finished'
      AND m.stage = 'group'
      AND (m.home_team_id = s.team_id OR m.away_team_id = s.team_id)
  ),
  won = (
    SELECT COUNT(*)::int FROM matches m
    WHERE m.status = 'finished' AND m.stage = 'group'
      AND m.home_team_id = s.team_id AND m.home_score > m.away_score
  ) + (
    SELECT COUNT(*)::int FROM matches m
    WHERE m.status = 'finished' AND m.stage = 'group'
      AND m.away_team_id = s.team_id AND m.away_score > m.home_score
  ),
  drawn = (
    SELECT COUNT(*)::int FROM matches m
    WHERE m.status = 'finished' AND m.stage = 'group'
      AND (m.home_team_id = s.team_id OR m.away_team_id = s.team_id)
      AND m.home_score = m.away_score
      AND m.home_score IS NOT NULL
  ),
  lost = (
    SELECT COUNT(*)::int FROM matches m
    WHERE m.status = 'finished' AND m.stage = 'group'
      AND m.home_team_id = s.team_id AND m.home_score < m.away_score
  ) + (
    SELECT COUNT(*)::int FROM matches m
    WHERE m.status = 'finished' AND m.stage = 'group'
      AND m.away_team_id = s.team_id AND m.away_score < m.home_score
  ),
  goals_for = (
    SELECT COALESCE(SUM(m.home_score), 0)::int FROM matches m
    WHERE m.status = 'finished' AND m.stage = 'group' AND m.home_team_id = s.team_id
  ) + (
    SELECT COALESCE(SUM(m.away_score), 0)::int FROM matches m
    WHERE m.status = 'finished' AND m.stage = 'group' AND m.away_team_id = s.team_id
  ),
  goals_against = (
    SELECT COALESCE(SUM(m.away_score), 0)::int FROM matches m
    WHERE m.status = 'finished' AND m.stage = 'group' AND m.home_team_id = s.team_id
  ) + (
    SELECT COALESCE(SUM(m.home_score), 0)::int FROM matches m
    WHERE m.status = 'finished' AND m.stage = 'group' AND m.away_team_id = s.team_id
  ),
  updated_at = NOW()
FROM teams t
WHERE s.team_id = t.id
  AND t.group_name <> 'K';

UPDATE standings s
SET points = (s.won * 3) + (s.drawn * 1), updated_at = NOW()
FROM teams t
WHERE s.team_id = t.id
  AND t.group_name <> 'K';

COMMIT;

-- Kiểm tra: SELECT * FROM standings s JOIN teams t ON t.id = s.team_id WHERE t.group_name <> 'K' ORDER BY t.group_name, s.points DESC;
