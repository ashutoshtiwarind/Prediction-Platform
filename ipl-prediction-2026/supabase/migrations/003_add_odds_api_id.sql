-- Add odds_api_id column to matches for upsert deduplication via Odds API
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS odds_api_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_matches_odds_api_id ON public.matches(odds_api_id);
