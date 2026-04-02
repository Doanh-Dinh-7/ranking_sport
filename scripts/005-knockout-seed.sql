-- Knockout demo (legacy — dữ liệu cũ)
-- Lịch + bracket đầy đủ theo giải HUGO: dùng 006-schedule-hugo-2026-bracket.sql thay cho file này.

INSERT INTO teams (name, short_name, logo_url, group_name)
VALUES ('Chờ xác định', 'TBD', NULL, 'A')
ON CONFLICT (short_name) DO NOTHING;

DELETE FROM match_events WHERE match_id IN (SELECT id FROM matches WHERE stage IN ('qf', 'sf', 'final'));
DELETE FROM matches WHERE stage IN ('qf', 'sf', 'final');

WITH ids AS (
  SELECT
    (SELECT id FROM teams WHERE short_name = '51K14+51K21') AS t1,
    (SELECT id FROM teams WHERE short_name = '48K21.2+48K05') AS t2,
    (SELECT id FROM teams WHERE short_name = '48K14.2') AS t3,
    (SELECT id FROM teams WHERE short_name = '51K36+51K36P') AS t4,
    (SELECT id FROM teams WHERE short_name = '49K05+51K05') AS t5,
    (SELECT id FROM teams WHERE short_name = '50K21.2+50K05') AS t6,
    (SELECT id FROM teams WHERE short_name = '48K14.1') AS t7,
    (SELECT id FROM teams WHERE short_name = '48K21.1') AS t8,
    (SELECT id FROM teams WHERE short_name = 'TBD') AS tbd,
    (SELECT id FROM venues WHERE name = 'Sân Lê Quý Đôn' LIMIT 1) AS v1,
    (SELECT id FROM venues WHERE name = 'Sân Trường ĐH Kinh Tế' LIMIT 1) AS v2
)
INSERT INTO matches (
  home_team_id, away_team_id, venue_id, scheduled_at,
  home_score, away_score, stage, status, bracket_slot
)
SELECT t1, t2, v1, '2026-03-30 19:00:00+07', 3, 1, 'qf', 'finished', 1 FROM ids
UNION ALL SELECT t3, t4, v2, '2026-03-30 21:00:00+07', 2, 0, 'qf', 'finished', 2 FROM ids
UNION ALL SELECT t5, t6, v1, '2026-03-31 19:00:00+07', 3, 2, 'qf', 'finished', 3 FROM ids
UNION ALL SELECT t7, t8, v2, '2026-03-31 21:00:00+07', 1, 0, 'qf', 'finished', 4 FROM ids
UNION ALL SELECT t1, t3, v1, '2026-04-05 19:00:00+07', 2, 1, 'sf', 'finished', 1 FROM ids
UNION ALL SELECT t5, t7, v2, '2026-04-06 19:00:00+07', NULL, NULL, 'sf', 'scheduled', 2 FROM ids
UNION ALL SELECT t1, tbd, v1, '2026-04-08 19:00:00+07', NULL, NULL, 'final', 'scheduled', 1 FROM ids;

INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, (SELECT id FROM teams WHERE short_name = '51K14+51K21'), 'goal', 'Tiền đạo A', 12
FROM matches m
WHERE m.stage = 'sf' AND m.bracket_slot = 1;

INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, (SELECT id FROM teams WHERE short_name = '48K14.2'), 'goal', 'Tiền đạo B', 34
FROM matches m
WHERE m.stage = 'sf' AND m.bracket_slot = 1;

INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, (SELECT id FROM teams WHERE short_name = '51K14+51K21'), 'goal', 'Captain A', 78
FROM matches m
WHERE m.stage = 'sf' AND m.bracket_slot = 1;
