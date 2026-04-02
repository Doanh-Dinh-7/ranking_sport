-- Bracket ordering for knockout stages (run in Supabase SQL Editor)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS bracket_slot INTEGER;
COMMENT ON COLUMN matches.bracket_slot IS 'Order within stage: QF 1-4, SF 1-2, Final 1';
