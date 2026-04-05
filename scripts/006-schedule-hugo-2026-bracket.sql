-- Giải HUGO Đà Nẵng — Lịch vòng bảng + knockout mặc định (03–11/04/2026)
-- Chạy trên Supabase SQL Editor SAU: 001, 002, 003, 004 (cột bracket_slot).
--
-- Nội dung:
--   • Xóa match_events + matches, reset standings về 0.
--   • Lịch ghi 5.1 / 5.2 / 5.3 / Sân Win → trong DB đều là venue "Sân Lê Quý Đôn" (003-seed-data.sql).
--   • 16 trận vòng bảng (theo bảng lịch BTC).
--   • Tứ kết / bán kết / tranh hạng 3 / chung kết với đội placeholder (Nhất/Nhì bảng, Thắng TK, …).
--
-- Lưu ý: Cập nhật tỉ số / đổi đội thật qua admin hoặc SQL khi có kết quả bảng.

BEGIN;

DELETE FROM match_events;
DELETE FROM matches;

-- Bản cũ từng tạo venue riêng cho 5.1, 5.2, … — xóa sau khi đã không còn trận trỏ tới.
DELETE FROM venues WHERE name IN ('Sân 5.1', 'Sân 5.2', 'Sân 5.3', 'Sân Win');

UPDATE standings SET
  played = 0,
  won = 0,
  drawn = 0,
  lost = 0,
  goals_for = 0,
  goals_against = 0,
  points = 0;

INSERT INTO teams (name, short_name, logo_url, group_name) VALUES
('Nhất bảng A', 'NA1', NULL, 'K'),
('Nhì bảng B', 'NB2', NULL, 'K'),
('Nhất bảng B', 'NB1', NULL, 'K'),
('Nhì bảng A', 'NA2', NULL, 'K'),
('Nhất bảng C', 'NC1', NULL, 'K'),
('Nhì bảng D', 'ND2', NULL, 'K'),
('Nhất bảng D', 'ND1', NULL, 'K'),
('Nhì bảng C', 'NC2', NULL, 'K'),
('Thắng tứ kết 1', 'W-QF1', NULL, 'K'),
('Thắng tứ kết 2', 'W-QF2', NULL, 'K'),
('Thắng tứ kết 3', 'W-QF3', NULL, 'K'),
('Thắng tứ kết 4', 'W-QF4', NULL, 'K'),
('Thắng bán kết 1', 'W-SF1', NULL, 'K'),
('Thắng bán kết 2', 'W-SF2', NULL, 'K'),
('Thua bán kết 1', 'L-SF1', NULL, 'K'),
('Thua bán kết 2', 'L-SF2', NULL, 'K')
ON CONFLICT (short_name) DO NOTHING;

-- Không insert standings cho nhóm K: trigger sẽ tạo khi có trận knockout kết thúc.

WITH
v AS (
  SELECT
    (SELECT id FROM venues WHERE name = 'Sân Lê Quý Đôn' LIMIT 1) AS v_lqd,
    (SELECT id FROM venues WHERE name = 'Sân Trường ĐH Kinh Tế' LIMIT 1) AS vkt
),
t AS (
  SELECT
    (SELECT id FROM teams WHERE short_name = '51K14+51K21') AS k51a,
    (SELECT id FROM teams WHERE short_name = '48K21.2+48K05') AS k48a,
    (SELECT id FROM teams WHERE short_name = '48K14.2') AS k482,
    (SELECT id FROM teams WHERE short_name = '51K36+51K36P') AS k51b,
    (SELECT id FROM teams WHERE short_name = '49K05+51K05') AS k495,
    (SELECT id FROM teams WHERE short_name = '50K21.2+50K05') AS k502,
    (SELECT id FROM teams WHERE short_name = '48K14.1') AS k481,
    (SELECT id FROM teams WHERE short_name = '48K21.1') AS k4821,
    (SELECT id FROM teams WHERE short_name = '50K14.1') AS k501,
    (SELECT id FROM teams WHERE short_name = '49K14.2+49K21.1') AS k492,
    (SELECT id FROM teams WHERE short_name = '49K14.1') AS k491,
    (SELECT id FROM teams WHERE short_name = '50K21.1') AS k5021,
    (SELECT id FROM teams WHERE short_name = '50K14.2') AS k5022,
    (SELECT id FROM teams WHERE short_name = 'NA1') AS na1,
    (SELECT id FROM teams WHERE short_name = 'NB2') AS nb2,
    (SELECT id FROM teams WHERE short_name = 'NB1') AS nb1,
    (SELECT id FROM teams WHERE short_name = 'NA2') AS na2,
    (SELECT id FROM teams WHERE short_name = 'NC1') AS nc1,
    (SELECT id FROM teams WHERE short_name = 'ND2') AS nd2,
    (SELECT id FROM teams WHERE short_name = 'ND1') AS nd1,
    (SELECT id FROM teams WHERE short_name = 'NC2') AS nc2,
    (SELECT id FROM teams WHERE short_name = 'W-QF1') AS wqf1,
    (SELECT id FROM teams WHERE short_name = 'W-QF2') AS wqf2,
    (SELECT id FROM teams WHERE short_name = 'W-QF3') AS wqf3,
    (SELECT id FROM teams WHERE short_name = 'W-QF4') AS wqf4,
    (SELECT id FROM teams WHERE short_name = 'W-SF1') AS wsf1,
    (SELECT id FROM teams WHERE short_name = 'W-SF2') AS wsf2,
    (SELECT id FROM teams WHERE short_name = 'L-SF1') AS lsf1,
    (SELECT id FROM teams WHERE short_name = 'L-SF2') AS lsf2
)
INSERT INTO matches (
  home_team_id, away_team_id, venue_id, scheduled_at,
  home_score, away_score, stage, status, bracket_slot
)
-- Vòng bảng (mọi trận tại 5.1/5.2/5.3/Sân Win → venue_id = Sân Lê Quý Đôn)
SELECT k51a, k48a, v_lqd, '2026-03-27 20:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'group', 'scheduled', NULL::integer FROM v, t
UNION ALL SELECT k51b, k495, v_lqd, '2026-03-27 20:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'group', 'scheduled', NULL::integer FROM v, t
UNION ALL SELECT k481, k4821, v_lqd, '2026-03-28 18:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'group', 'scheduled', NULL::integer FROM v, t
UNION ALL SELECT k5021, k5022, v_lqd, '2026-03-28 19:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'group', 'scheduled', NULL::integer FROM v, t
UNION ALL SELECT k51a, k482, v_lqd, '2026-03-29 19:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'group', 'scheduled', NULL::integer FROM v, t
UNION ALL SELECT k51b, k502, v_lqd, '2026-03-31 19:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'group', 'scheduled', NULL::integer FROM v, t
UNION ALL SELECT k481, k501, v_lqd, '2026-03-31 19:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'group', 'scheduled', NULL::integer FROM v, t
UNION ALL SELECT k491, k5022, v_lqd, '2026-04-01 16:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'group', 'scheduled', NULL::integer FROM v, t
UNION ALL SELECT k492, k5021, v_lqd, '2026-04-01 20:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'group', 'scheduled', NULL::integer FROM v, t
UNION ALL SELECT k48a, k482, v_lqd, '2026-04-01 20:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'group', 'scheduled', NULL::integer FROM v, t
UNION ALL SELECT k492, k5022, v_lqd, '2026-04-03 16:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'group', 'scheduled', NULL::integer FROM v, t
UNION ALL SELECT k495, k502, v_lqd, '2026-04-03 20:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'group', 'scheduled', NULL::integer FROM v, t
UNION ALL SELECT k491, k5021, v_lqd, '2026-04-03 20:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'group', 'scheduled', NULL::integer FROM v, t
UNION ALL SELECT k4821, k501, v_lqd, '2026-04-04 19:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'group', 'scheduled', NULL::integer FROM v, t
UNION ALL SELECT k492, k491, v_lqd, '2026-04-05 19:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'group', 'scheduled', NULL::integer FROM v, t
-- Tứ kết: TK1 Nhất A vs Nhì B; TK2 Nhất C vs Nhì D; TK3 Nhất B vs Nhì A; TK4 Nhất D vs Nhì C
UNION ALL SELECT na1, nb2, v_lqd, '2026-04-07 19:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'qf', 'scheduled', 1 FROM v, t
UNION ALL SELECT nc1, nd2, v_lqd, '2026-04-07 19:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'qf', 'scheduled', 2 FROM v, t
UNION ALL SELECT nb1, na2, v_lqd, '2026-04-07 20:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'qf', 'scheduled', 3 FROM v, t
UNION ALL SELECT nd1, nc2, v_lqd, '2026-04-07 20:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'qf', 'scheduled', 4 FROM v, t
-- Bán kết: Thắng TK1 vs Thắng TK2; Thắng TK3 vs Thắng TK4 (khớp UI + trigger 009)
UNION ALL SELECT wqf1, wqf2, v_lqd, '2026-04-09 19:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'sf', 'scheduled', 1 FROM v, t
UNION ALL SELECT wqf3, wqf4, v_lqd, '2026-04-09 19:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'sf', 'scheduled', 2 FROM v, t
-- Tranh hạng 3 + Chung kết (Sân Trường ĐH Kinh Tế)
UNION ALL SELECT lsf1, lsf2, vkt, '2026-04-11 17:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'third_place', 'scheduled', 1 FROM v, t
UNION ALL SELECT wsf1, wsf2, vkt, '2026-04-11 19:30:00+07'::timestamptz, NULL::integer, NULL::integer, 'final', 'scheduled', 1 FROM v, t;

COMMIT;
