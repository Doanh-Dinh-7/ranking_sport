-- Cho phép role `anon` (Supabase anon key) INSERT/UPDATE/DELETE trên các bảng admin cần ghi.
-- Dùng khi KHÔNG dùng service_role: ủy quyền thật sự nằm ở cookie admin Next.js API.
-- CẢNH BÁO: Ai có URL + anon key có thể gọi PostgREST trực tiếp — chỉ phù hợp MVP nội bộ.
-- Chạy sau 001 và 013.

-- teams
DROP POLICY IF EXISTS anon_insert_teams ON public.teams;
DROP POLICY IF EXISTS anon_update_teams ON public.teams;
DROP POLICY IF EXISTS anon_delete_teams ON public.teams;
CREATE POLICY anon_insert_teams ON public.teams FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_teams ON public.teams FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_teams ON public.teams FOR DELETE TO anon USING (true);

-- standings
DROP POLICY IF EXISTS anon_insert_standings ON public.standings;
DROP POLICY IF EXISTS anon_update_standings ON public.standings;
DROP POLICY IF EXISTS anon_delete_standings ON public.standings;
CREATE POLICY anon_insert_standings ON public.standings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_standings ON public.standings FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_standings ON public.standings FOR DELETE TO anon USING (true);

-- tournament_settings
DROP POLICY IF EXISTS anon_insert_tournament_settings ON public.tournament_settings;
DROP POLICY IF EXISTS anon_update_tournament_settings ON public.tournament_settings;
CREATE POLICY anon_insert_tournament_settings ON public.tournament_settings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_tournament_settings ON public.tournament_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- matches
DROP POLICY IF EXISTS anon_insert_matches ON public.matches;
DROP POLICY IF EXISTS anon_update_matches ON public.matches;
DROP POLICY IF EXISTS anon_delete_matches ON public.matches;
CREATE POLICY anon_insert_matches ON public.matches FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_matches ON public.matches FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_matches ON public.matches FOR DELETE TO anon USING (true);

-- match_events (admin diễn biến trận)
DROP POLICY IF EXISTS anon_insert_match_events ON public.match_events;
DROP POLICY IF EXISTS anon_update_match_events ON public.match_events;
DROP POLICY IF EXISTS anon_delete_match_events ON public.match_events;
CREATE POLICY anon_insert_match_events ON public.match_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_match_events ON public.match_events FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_match_events ON public.match_events FOR DELETE TO anon USING (true);
