-- Đẩy đội thắng/thua tự động sau khi trận knockout kết thúc (status → finished).
-- Chạy trên Supabase SAU: 001, 002, 003, 004, 006 (và mọi script đã gán QF đúng bracket_slot 1–4).
--
-- Hòa (home_score = away_score): không cập nhật vòng sau.

BEGIN;

-- (A) Đồng bộ 2 trận bán kết: SF1 = W-QF1 vs W-QF2, SF2 = W-QF3 vs W-QF4
UPDATE matches m
SET
  home_team_id = (SELECT id FROM teams WHERE short_name = 'W-QF1' LIMIT 1),
  away_team_id = (SELECT id FROM teams WHERE short_name = 'W-QF2' LIMIT 1),
  updated_at = NOW()
WHERE m.stage = 'sf' AND m.bracket_slot = 1;

UPDATE matches m
SET
  home_team_id = (SELECT id FROM teams WHERE short_name = 'W-QF3' LIMIT 1),
  away_team_id = (SELECT id FROM teams WHERE short_name = 'W-QF4' LIMIT 1),
  updated_at = NOW()
WHERE m.stage = 'sf' AND m.bracket_slot = 2;

CREATE OR REPLACE FUNCTION advance_knockout_bracket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w UUID;
  l UUID;
BEGIN
  -- Chỉ khi vừa chuyển sang finished
  IF NEW.status IS DISTINCT FROM 'finished' OR OLD.status = 'finished' THEN
    RETURN NEW;
  END IF;

  IF NEW.home_score IS NULL OR NEW.away_score IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.home_score = NEW.away_score THEN
    RETURN NEW;
  END IF;

  IF NEW.home_score > NEW.away_score THEN
    w := NEW.home_team_id;
    l := NEW.away_team_id;
  ELSE
    w := NEW.away_team_id;
    l := NEW.home_team_id;
  END IF;

  -- Tứ kết
  IF NEW.stage = 'qf' AND NEW.bracket_slot IS NOT NULL THEN
    IF NEW.bracket_slot = 1 THEN
      UPDATE matches m
      SET home_team_id = w, updated_at = NOW()
      FROM teams th
      WHERE m.stage = 'sf'
        AND m.bracket_slot = 1
        AND m.home_team_id = th.id
        AND th.short_name = 'W-QF1';
    ELSIF NEW.bracket_slot = 2 THEN
      UPDATE matches m
      SET away_team_id = w, updated_at = NOW()
      FROM teams th
      WHERE m.stage = 'sf'
        AND m.bracket_slot = 1
        AND m.away_team_id = th.id
        AND th.short_name = 'W-QF2';
    ELSIF NEW.bracket_slot = 3 THEN
      UPDATE matches m
      SET home_team_id = w, updated_at = NOW()
      FROM teams th
      WHERE m.stage = 'sf'
        AND m.bracket_slot = 2
        AND m.home_team_id = th.id
        AND th.short_name = 'W-QF3';
    ELSIF NEW.bracket_slot = 4 THEN
      UPDATE matches m
      SET away_team_id = w, updated_at = NOW()
      FROM teams th
      WHERE m.stage = 'sf'
        AND m.bracket_slot = 2
        AND m.away_team_id = th.id
        AND th.short_name = 'W-QF4';
    END IF;
    RETURN NEW;
  END IF;

  -- Bán kết
  IF NEW.stage = 'sf' AND NEW.bracket_slot IS NOT NULL THEN
    IF NEW.bracket_slot = 1 THEN
      UPDATE matches m
      SET home_team_id = w, updated_at = NOW()
      FROM teams th
      WHERE m.stage = 'final'
        AND m.bracket_slot = 1
        AND m.home_team_id = th.id
        AND th.short_name = 'W-SF1';

      UPDATE matches m
      SET home_team_id = l, updated_at = NOW()
      FROM teams th
      WHERE m.stage = 'third_place'
        AND m.bracket_slot = 1
        AND m.home_team_id = th.id
        AND th.short_name = 'L-SF1';
    ELSIF NEW.bracket_slot = 2 THEN
      UPDATE matches m
      SET away_team_id = w, updated_at = NOW()
      FROM teams th
      WHERE m.stage = 'final'
        AND m.bracket_slot = 1
        AND m.away_team_id = th.id
        AND th.short_name = 'W-SF2';

      UPDATE matches m
      SET away_team_id = l, updated_at = NOW()
      FROM teams th
      WHERE m.stage = 'third_place'
        AND m.bracket_slot = 1
        AND m.away_team_id = th.id
        AND th.short_name = 'L-SF2';
    END IF;
    RETURN NEW;
  END IF;

  -- Chung kết / tranh hạng 3: không có vòng sau
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_knockout_advance ON matches;

CREATE TRIGGER trigger_knockout_advance
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION advance_knockout_bracket();

COMMENT ON FUNCTION advance_knockout_bracket() IS
  'Khi trận qf/sf chuyển sang finished có tỉ số phân thắng thua: gán đội vào trận knockout kế tiếp (theo W-QF*, W-SF*, L-SF*).';

COMMIT;
