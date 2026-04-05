-- Bracket ordering for knockout stages (run in Supabase SQL Editor)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS bracket_slot INTEGER;
COMMENT ON COLUMN matches.bracket_slot IS 'QF 1-4 = TK1-TK4; SF 1 = W-TK1 vs W-TK2, SF 2 = W-TK3 vs W-TK4; Final 1';
