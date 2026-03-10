-- Create recently_seen table for tracking listing impressions in Discover
CREATE TABLE public.recently_seen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.clothing_listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seen_at timestamptz NOT NULL DEFAULT now(),
  seen_date text NOT NULL,
  UNIQUE(user_id, listing_id, seen_date)
);

-- Create index for efficient queries by user and date
CREATE INDEX idx_recently_seen_user_date ON public.recently_seen(user_id, seen_date, seen_at DESC);

-- Enable Row Level Security
ALTER TABLE public.recently_seen ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only manage their own rows
CREATE POLICY "Users can view their own recently seen"
  ON public.recently_seen FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recently seen"
  ON public.recently_seen FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recently seen"
  ON public.recently_seen FOR DELETE
  USING (auth.uid() = user_id);