-- Create listing_interactions table for persisting declined/seen interactions
CREATE TABLE public.listing_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.clothing_listings(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('declined', 'seen')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Enable RLS
ALTER TABLE public.listing_interactions ENABLE ROW LEVEL SECURITY;

-- Users can read only their own interactions
CREATE POLICY "Users can view their own interactions"
ON public.listing_interactions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own interactions
CREATE POLICY "Users can create their own interactions"
ON public.listing_interactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own interactions (for upsert behavior)
CREATE POLICY "Users can update their own interactions"
ON public.listing_interactions
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own interactions (for undo functionality)
CREATE POLICY "Users can delete their own interactions"
ON public.listing_interactions
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for efficient lookups
CREATE INDEX idx_listing_interactions_user_id ON public.listing_interactions(user_id);
CREATE INDEX idx_listing_interactions_user_listing ON public.listing_interactions(user_id, listing_id);