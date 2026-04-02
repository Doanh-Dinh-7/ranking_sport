-- Cập nhật tỉ số + sự kiện ghi bàn vòng bảng (theo BTC)
-- Chạy SAU 003 + 006 (đã có trận group scheduled).
-- Trigger standings: cập nhật khi status → finished (3/1/0 điểm).
--
-- Cặp đội khớp 006 (home/away theo DB). Phút: lấy số phút trước dấu ' hoặc " (giây đầu hiệp → phút 0→1).
-- Trận 2-2 (29/3): ghi Phạm Nguyên Khang (OG) như bàn cho đội khách trong bảng sự kiện (tỉ số 2-2).

BEGIN;

-- Xóa sự kiện cũ của các trận này (nếu chạy lại script)
DELETE FROM match_events
WHERE match_id IN (
  SELECT m.id
  FROM matches m
  JOIN teams h ON m.home_team_id = h.id
  JOIN teams a ON m.away_team_id = a.id
  WHERE m.stage = 'group'
    AND (
      (h.short_name = '51K14+51K21' AND a.short_name = '48K21.2+48K05')
      OR (h.short_name = '51K36+51K36P' AND a.short_name = '49K05+51K05')
      OR (h.short_name = '48K14.1' AND a.short_name = '48K21.1')
      OR (h.short_name = '50K21.1' AND a.short_name = '50K14.2')
      OR (h.short_name = '51K14+51K21' AND a.short_name = '48K14.2')
      OR (h.short_name = '48K14.1' AND a.short_name = '50K14.1')
      OR (h.short_name = '51K36+51K36P' AND a.short_name = '50K21.2+50K05')
      OR (h.short_name = '49K14.1' AND a.short_name = '50K14.2')
      OR (h.short_name = '49K14.2+49K21.1' AND a.short_name = '50K21.1')
      OR (h.short_name = '48K21.2+48K05' AND a.short_name = '48K14.2')
    )
);

-- Cập nhật tỉ số + kết thúc
UPDATE matches AS m
SET
  home_score = v.hs,
  away_score = v.as_,
  status = 'finished',
  updated_at = NOW()
FROM (
  VALUES
    ('51K14+51K21', '48K21.2+48K05', 15, 0),
    ('51K36+51K36P', '49K05+51K05', 1, 6),
    ('48K14.1', '48K21.1', 5, 1),
    ('50K21.1', '50K14.2', 5, 1),
    ('51K14+51K21', '48K14.2', 2, 2),
    ('48K14.1', '50K14.1', 2, 5),
    ('51K36+51K36P', '50K21.2+50K05', 2, 3),
    ('49K14.1', '50K14.2', 1, 3),
    ('49K14.2+49K21.1', '50K21.1', 5, 0),
    ('48K21.2+48K05', '48K14.2', 1, 6)
) AS v(hs_name, as_name, hs, as_)
JOIN teams th ON th.short_name = v.hs_name
JOIN teams ta ON ta.short_name = v.as_name
WHERE m.home_team_id = th.id AND m.away_team_id = ta.id AND m.stage = 'group';

-- Helper: chèn goal
-- Match 1: 51K14+51K21 15-0 48K21.2+48K05
INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.home_team_id, 'goal', x.player, x.minute
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '51K14+51K21'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '48K21.2+48K05'
CROSS JOIN (
  VALUES
    ('Huỳnh Minh Đại', 0),
    ('Huỳnh Minh Đại', 15),
    ('Huỳnh Minh Đại', 16),
    ('Huỳnh Minh Đại', 20),
    ('Huỳnh Minh Đại', 6),
    ('Huỳnh Minh Đại', 14),
    ('Nguyễn Hải Hoàng Vỹ', 22),
    ('Nguyễn Hải Hoàng Vỹ', 4),
    ('Nguyễn Hải Hoàng Vỹ', 9),
    ('Nguyễn Hải Hoàng Vỹ', 15),
    ('Nguyễn Hải Hoàng Vỹ', 16),
    ('Nguyễn Hải Hoàng Vỹ', 17),
    ('Đào Quang Thắng', 3),
    ('Đào Quang Thắng', 13),
    ('Đàm Quang Thịnh', 18)
) AS x(player, minute)
WHERE m.stage = 'group';

-- Match 2: 51K36+51K36P 1-6 49K05+51K05
INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.home_team_id, 'goal', 'Nguyễn Đức Phương', 5
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '51K36+51K36P'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '49K05+51K05'
WHERE m.stage = 'group';

INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.away_team_id, 'goal', x.player, x.minute
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '51K36+51K36P'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '49K05+51K05'
CROSS JOIN (
  VALUES
    ('Hồ Anh Quân', 6),
    ('Hồ Anh Quân', 19),
    ('Hồ Anh Quân', 17),
    ('Tô Nguyễn Quốc Bảo', 16),
    ('Tô Nguyễn Quốc Bảo', 2),
    ('Nguyễn Thành Luân', 0)
) AS x(player, minute)
WHERE m.stage = 'group';

-- Match 3: 48K14.1 5-1 48K21.1
INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.away_team_id, 'goal', 'Nguyễn Hữu Toàn', 8
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '48K14.1'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '48K21.1'
WHERE m.stage = 'group';

INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.home_team_id, 'goal', x.player, x.minute
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '48K14.1'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '48K21.1'
CROSS JOIN (
  VALUES
    ('Trần Thành Hồng Quân', 16),
    ('Trần Thành Hồng Quân', 1),
    ('Trần Thành Hồng Quân', 13),
    ('Phan Thiện An', 9),
    ('Đoàn Kim Giáp', 9)
) AS x(player, minute)
WHERE m.stage = 'group';

-- Match 4: 50K21.1 5-1 50K14.2
INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.home_team_id, 'goal', x.player, x.minute
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '50K21.1'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '50K14.2'
CROSS JOIN (
  VALUES
    ('Nguyễn Hoàn Vũ', 13),
    ('Nguyễn Hoàn Vũ', 21),
    ('Nguyễn Hoàn Vũ', 14),
    ('Nguyễn Bảo Khanh', 6),
    ('Nguyễn Bảo Khanh', 24)
) AS x(player, minute)
WHERE m.stage = 'group';

INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.away_team_id, 'goal', 'Nguyễn Văn Toàn', 17
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '50K21.1'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '50K14.2'
WHERE m.stage = 'group';

-- Match 5: 51K14+51K21 2-2 48K14.2 — OG: bàn cho đội nhà
INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.home_team_id, 'goal', x.player, x.minute
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '51K14+51K21'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '48K14.2'
CROSS JOIN (
  VALUES
    ('Lê Hà Phát', 7),
    ('Nguyễn Hải Hoàng Vỹ', 18)
) AS x(player, minute)
WHERE m.stage = 'group';

INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.away_team_id, 'goal', 'Nguyễn Công Thanh Mỹ', 2
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '51K14+51K21'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '48K14.2'
WHERE m.stage = 'group';

INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.away_team_id, 'goal', 'Phạm Nguyên Khang (OG)', 19
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '51K14+51K21'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '48K14.2'
WHERE m.stage = 'group';

-- Match 6: 48K14.1 2-5 50K14.1 (nhà 48K14.1)
INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.away_team_id, 'goal', x.player, x.minute
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '48K14.1'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '50K14.1'
CROSS JOIN (
  VALUES
    ('Trần Hoài Nam', 5),
    ('Võ Nhật Minh', 8),
    ('Nguyễn Đăng An', 10),
    ('Trần Quốc Pháp', 4),
    ('Trần Anh Trí', 16)
) AS x(player, minute)
WHERE m.stage = 'group';

INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.home_team_id, 'goal', x.player, x.minute
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '48K14.1'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '50K14.1'
CROSS JOIN (
  VALUES
    ('Trần Thành Hồng Quân', 6),
    ('Đoàn Kim Giáp', 19)
) AS x(player, minute)
WHERE m.stage = 'group';

-- Match 7: 51K36+51K36P 2-3 50K21.2+50K05
INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.home_team_id, 'goal', x.player, x.minute
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '51K36+51K36P'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '50K21.2+50K05'
CROSS JOIN (
  VALUES
    ('Nguyễn Đức Phương', 11),
    ('Trương Nhật Linh', 13)
) AS x(player, minute)
WHERE m.stage = 'group';

INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.away_team_id, 'goal', x.player, x.minute
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '51K36+51K36P'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '50K21.2+50K05'
CROSS JOIN (
  VALUES
    ('Ngô Quỳnh Dương', 10),
    ('Hà Trung Kiên', 1),
    ('Lê Văn Tiến Hiệp', 6)
) AS x(player, minute)
WHERE m.stage = 'group';

-- Match 8: 49K14.1 1-3 50K14.2
INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.away_team_id, 'goal', x.player, x.minute
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '49K14.1'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '50K14.2'
CROSS JOIN (
  VALUES
    ('Nguyễn Nhất Huy', 4),
    ('Nguyễn Nhất Huy', 18),
    ('Lê Văn Trường', 1)
) AS x(player, minute)
WHERE m.stage = 'group';

INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.home_team_id, 'goal', 'Hồ Sỹ Hải Lâm', 7
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '49K14.1'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '50K14.2'
WHERE m.stage = 'group';

-- Match 9: 49K14.2+49K21.1 5-0 50K21.1
INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.home_team_id, 'goal', x.player, x.minute
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '49K14.2+49K21.1'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '50K21.1'
CROSS JOIN (
  VALUES
    ('Nguyễn Hữu Quốc', 0),
    ('Nguyễn Hữu Quốc', 1),
    ('Hồ Đức Hậu', 11),
    ('Trương Thanh Hạnh', 16),
    ('Nguyễn Thành Luân', 15)
) AS x(player, minute)
WHERE m.stage = 'group';

-- Match 10: 48K21.2+48K05 1-6 48K14.2
INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.away_team_id, 'goal', x.player, x.minute
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '48K21.2+48K05'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '48K14.2'
CROSS JOIN (
  VALUES
    ('Ngô Văn Cường', 3),
    ('Ngô Văn Cường', 10),
    ('Võ Văn Bảo Nguyên', 16),
    ('Nguyễn Công Thanh Mỹ', 9),
    ('Nguyễn Công Thanh Mỹ', 14),
    ('Nguyễn Anh Tú', 21)
) AS x(player, minute)
WHERE m.stage = 'group';

INSERT INTO match_events (match_id, team_id, event_type, player_name, minute)
SELECT m.id, m.home_team_id, 'goal', 'Trần Hiệp Lực', 8
FROM matches m
JOIN teams h ON m.home_team_id = h.id AND h.short_name = '48K21.2+48K05'
JOIN teams a ON m.away_team_id = a.id AND a.short_name = '48K14.2'
WHERE m.stage = 'group';

COMMIT;
