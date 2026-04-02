-- Gán nhất / nhì từng bảng A–D vào trận tứ kết (placeholder 006).
-- Chạy SAU 006 và khi standings các bảng đã đúng (vd. đã chạy 007).
--
-- Quy tắc xếp hạng: điểm → hiệu số → bàn thắng (giống standings-table).
--
-- TK slot 1: Nhất A vs Nhì B  → home NA1, away NB2
-- TK slot 2: Nhất B vs Nhì A  → home NB1, away NA2
-- TK slot 3: Nhất C vs Nhì D  → home NC1, away ND2
-- TK slot 4: Nhất D vs Nhì C  → home ND1, away NC2

BEGIN;

-- ——— Bảng A ———
UPDATE matches AS m
SET home_team_id = r.team_id, updated_at = NOW()
FROM (
  SELECT s.team_id, ROW_NUMBER() OVER (
    ORDER BY s.points DESC, (s.goals_for - s.goals_against) DESC, s.goals_for DESC
  ) AS rk
  FROM standings s
  INNER JOIN teams t ON t.id = s.team_id AND t.group_name = 'A'
) AS r
WHERE m.stage = 'qf' AND m.bracket_slot = 1
  AND m.home_team_id = (SELECT id FROM teams WHERE short_name = 'NA1')
  AND r.rk = 1;

UPDATE matches AS m
SET away_team_id = r.team_id, updated_at = NOW()
FROM (
  SELECT s.team_id, ROW_NUMBER() OVER (
    ORDER BY s.points DESC, (s.goals_for - s.goals_against) DESC, s.goals_for DESC
  ) AS rk
  FROM standings s
  INNER JOIN teams t ON t.id = s.team_id AND t.group_name = 'A'
) AS r
WHERE m.stage = 'qf' AND m.bracket_slot = 2
  AND m.away_team_id = (SELECT id FROM teams WHERE short_name = 'NA2')
  AND r.rk = 2;

-- ——— Bảng B ———
UPDATE matches AS m
SET home_team_id = r.team_id, updated_at = NOW()
FROM (
  SELECT s.team_id, ROW_NUMBER() OVER (
    ORDER BY s.points DESC, (s.goals_for - s.goals_against) DESC, s.goals_for DESC
  ) AS rk
  FROM standings s
  INNER JOIN teams t ON t.id = s.team_id AND t.group_name = 'B'
) AS r
WHERE m.stage = 'qf' AND m.bracket_slot = 2
  AND m.home_team_id = (SELECT id FROM teams WHERE short_name = 'NB1')
  AND r.rk = 1;

UPDATE matches AS m
SET away_team_id = r.team_id, updated_at = NOW()
FROM (
  SELECT s.team_id, ROW_NUMBER() OVER (
    ORDER BY s.points DESC, (s.goals_for - s.goals_against) DESC, s.goals_for DESC
  ) AS rk
  FROM standings s
  INNER JOIN teams t ON t.id = s.team_id AND t.group_name = 'B'
) AS r
WHERE m.stage = 'qf' AND m.bracket_slot = 1
  AND m.away_team_id = (SELECT id FROM teams WHERE short_name = 'NB2')
  AND r.rk = 2;

-- ——— Bảng C ———
UPDATE matches AS m
SET home_team_id = r.team_id, updated_at = NOW()
FROM (
  SELECT s.team_id, ROW_NUMBER() OVER (
    ORDER BY s.points DESC, (s.goals_for - s.goals_against) DESC, s.goals_for DESC
  ) AS rk
  FROM standings s
  INNER JOIN teams t ON t.id = s.team_id AND t.group_name = 'C'
) AS r
WHERE m.stage = 'qf' AND m.bracket_slot = 3
  AND m.home_team_id = (SELECT id FROM teams WHERE short_name = 'NC1')
  AND r.rk = 1;

UPDATE matches AS m
SET away_team_id = r.team_id, updated_at = NOW()
FROM (
  SELECT s.team_id, ROW_NUMBER() OVER (
    ORDER BY s.points DESC, (s.goals_for - s.goals_against) DESC, s.goals_for DESC
  ) AS rk
  FROM standings s
  INNER JOIN teams t ON t.id = s.team_id AND t.group_name = 'C'
) AS r
WHERE m.stage = 'qf' AND m.bracket_slot = 4
  AND m.away_team_id = (SELECT id FROM teams WHERE short_name = 'NC2')
  AND r.rk = 2;

-- ——— Bảng D ———
UPDATE matches AS m
SET home_team_id = r.team_id, updated_at = NOW()
FROM (
  SELECT s.team_id, ROW_NUMBER() OVER (
    ORDER BY s.points DESC, (s.goals_for - s.goals_against) DESC, s.goals_for DESC
  ) AS rk
  FROM standings s
  INNER JOIN teams t ON t.id = s.team_id AND t.group_name = 'D'
) AS r
WHERE m.stage = 'qf' AND m.bracket_slot = 4
  AND m.home_team_id = (SELECT id FROM teams WHERE short_name = 'ND1')
  AND r.rk = 1;

UPDATE matches AS m
SET away_team_id = r.team_id, updated_at = NOW()
FROM (
  SELECT s.team_id, ROW_NUMBER() OVER (
    ORDER BY s.points DESC, (s.goals_for - s.goals_against) DESC, s.goals_for DESC
  ) AS rk
  FROM standings s
  INNER JOIN teams t ON t.id = s.team_id AND t.group_name = 'D'
) AS r
WHERE m.stage = 'qf' AND m.bracket_slot = 3
  AND m.away_team_id = (SELECT id FROM teams WHERE short_name = 'ND2')
  AND r.rk = 2;

COMMIT;

-- Kiểm tra: SELECT bracket_slot, home_team_id, away_team_id FROM matches WHERE stage = 'qf' ORDER BY bracket_slot;
