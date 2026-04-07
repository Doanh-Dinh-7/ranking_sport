-- Football Tournament Platform — PostgreSQL Trigger for Auto-Standings
-- Execute AFTER 001-tournament-schema.sql
-- Chỉ cập nhật standings khi trận VÒNG BẢNG (stage = 'group') kết thúc / đổi tỉ số.
-- Trận qf/sf/final/third_place không làm thay đổi bảng xếp hạng vòng bảng.

-- Create function to update standings
CREATE OR REPLACE FUNCTION update_standings_on_match_finish()
RETURNS TRIGGER AS $$
BEGIN
  -- Chỉ xử lý trận vòng bảng; knockout không đụng standings
  IF NEW.status = 'finished'
     AND NEW.stage = 'group'
     AND (
       OLD.status IS DISTINCT FROM NEW.status
       OR NEW.home_score IS DISTINCT FROM OLD.home_score
       OR NEW.away_score IS DISTINCT FROM OLD.away_score
     ) THEN

    -- Ensure standings entries exist for both teams
    INSERT INTO standings (team_id, group_name, played, won, drawn, lost, goals_for, goals_against, points)
    SELECT id, group_name, 0, 0, 0, 0, 0, 0, 0
    FROM teams
    WHERE id IN (NEW.home_team_id, NEW.away_team_id)
    ON CONFLICT (team_id) DO NOTHING;

    -- Recalculate standings for home team (chỉ trận stage = 'group')
    UPDATE standings SET
      played = (SELECT COUNT(*) FROM matches WHERE (home_team_id = NEW.home_team_id OR away_team_id = NEW.home_team_id) AND status = 'finished' AND stage = 'group'),
      won = (SELECT COUNT(*) FROM matches WHERE home_team_id = NEW.home_team_id AND home_score > away_score AND status = 'finished' AND stage = 'group') +
            (SELECT COUNT(*) FROM matches WHERE away_team_id = NEW.home_team_id AND away_score > home_score AND status = 'finished' AND stage = 'group'),
      drawn = (SELECT COUNT(*) FROM matches WHERE (home_team_id = NEW.home_team_id OR away_team_id = NEW.home_team_id) AND home_score = away_score AND status = 'finished' AND stage = 'group'),
      lost = (SELECT COUNT(*) FROM matches WHERE home_team_id = NEW.home_team_id AND home_score < away_score AND status = 'finished' AND stage = 'group') +
             (SELECT COUNT(*) FROM matches WHERE away_team_id = NEW.home_team_id AND away_score < home_score AND status = 'finished' AND stage = 'group'),
      goals_for = (SELECT COALESCE(SUM(home_score), 0) FROM matches WHERE home_team_id = NEW.home_team_id AND status = 'finished' AND stage = 'group') +
                  (SELECT COALESCE(SUM(away_score), 0) FROM matches WHERE away_team_id = NEW.home_team_id AND status = 'finished' AND stage = 'group'),
      goals_against = (SELECT COALESCE(SUM(away_score), 0) FROM matches WHERE home_team_id = NEW.home_team_id AND status = 'finished' AND stage = 'group') +
                      (SELECT COALESCE(SUM(home_score), 0) FROM matches WHERE away_team_id = NEW.home_team_id AND status = 'finished' AND stage = 'group'),
      updated_at = NOW()
    WHERE team_id = NEW.home_team_id;

    -- Update points (Win=3, Draw=1, Loss=0)
    UPDATE standings SET
      points = (won * 3) + (drawn * 1)
    WHERE team_id = NEW.home_team_id;

    -- Recalculate standings for away team (chỉ trận stage = 'group')
    UPDATE standings SET
      played = (SELECT COUNT(*) FROM matches WHERE (home_team_id = NEW.away_team_id OR away_team_id = NEW.away_team_id) AND status = 'finished' AND stage = 'group'),
      won = (SELECT COUNT(*) FROM matches WHERE home_team_id = NEW.away_team_id AND home_score > away_score AND status = 'finished' AND stage = 'group') +
            (SELECT COUNT(*) FROM matches WHERE away_team_id = NEW.away_team_id AND away_score > home_score AND status = 'finished' AND stage = 'group'),
      drawn = (SELECT COUNT(*) FROM matches WHERE (home_team_id = NEW.away_team_id OR away_team_id = NEW.away_team_id) AND home_score = away_score AND status = 'finished' AND stage = 'group'),
      lost = (SELECT COUNT(*) FROM matches WHERE home_team_id = NEW.away_team_id AND home_score < away_score AND status = 'finished' AND stage = 'group') +
             (SELECT COUNT(*) FROM matches WHERE away_team_id = NEW.away_team_id AND away_score < home_score AND status = 'finished' AND stage = 'group'),
      goals_for = (SELECT COALESCE(SUM(home_score), 0) FROM matches WHERE home_team_id = NEW.away_team_id AND status = 'finished' AND stage = 'group') +
                  (SELECT COALESCE(SUM(away_score), 0) FROM matches WHERE away_team_id = NEW.away_team_id AND status = 'finished' AND stage = 'group'),
      goals_against = (SELECT COALESCE(SUM(away_score), 0) FROM matches WHERE home_team_id = NEW.away_team_id AND status = 'finished' AND stage = 'group') +
                      (SELECT COALESCE(SUM(home_score), 0) FROM matches WHERE away_team_id = NEW.away_team_id AND status = 'finished' AND stage = 'group'),
      updated_at = NOW()
    WHERE team_id = NEW.away_team_id;

    -- Update points for away team
    UPDATE standings SET
      points = (won * 3) + (drawn * 1)
    WHERE team_id = NEW.away_team_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after ANY update to matches
DROP TRIGGER IF EXISTS trigger_update_standings ON matches;
CREATE TRIGGER trigger_update_standings
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION update_standings_on_match_finish();

-- Initial standings creation: run this once after inserting teams
-- SELECT create_initial_standings();

-- Helper function to initialize standings for all teams (run once after seeding teams)
CREATE OR REPLACE FUNCTION create_initial_standings()
RETURNS void AS $$
BEGIN
  INSERT INTO standings (team_id, group_name, played, won, drawn, lost, goals_for, goals_against, points)
  SELECT id, group_name, 0, 0, 0, 0, 0, 0, 0
  FROM teams
  ON CONFLICT (team_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
