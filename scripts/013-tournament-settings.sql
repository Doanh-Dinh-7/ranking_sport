-- Cấu hình vòng bảng (số bảng, số đội mỗi bảng) — dùng cho trang admin.
-- Chạy trong Supabase SQL Editor sau các script schema hiện có.

CREATE TABLE IF NOT EXISTS tournament_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  group_count INT NOT NULL DEFAULT 4 CHECK (group_count >= 1 AND group_count <= 12),
  teams_per_group INT NOT NULL DEFAULT 4 CHECK (teams_per_group >= 1 AND teams_per_group <= 16),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tournament_settings (id, group_count, teams_per_group)
VALUES ('default', 4, 4)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE tournament_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_tournament_settings"
  ON tournament_settings FOR SELECT USING (true);

COMMENT ON TABLE tournament_settings IS 'Tham số vòng bảng; ghi qua Next.js admin API (anon + RLS scripts/014).';
