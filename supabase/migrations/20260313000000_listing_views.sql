-- ===========================================================================
-- LISTING VIEWS
-- Tracks unique user views per listing (one row per user+listing pair).
-- Sellers can see how many unique people viewed each listing.
-- ===========================================================================

CREATE TABLE public.listing_views (
  listing_id uuid NOT NULL REFERENCES public.clothing_listings(id) ON DELETE CASCADE,
  viewer_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  viewed_at  timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (listing_id, viewer_id)
);

CREATE INDEX idx_listing_views_listing_id ON public.listing_views(listing_id);

ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can upsert their own view
CREATE POLICY "Users can insert own views"
  ON public.listing_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

-- Listing owner can count views on their listings
CREATE POLICY "Seller can read views on own listings"
  ON public.listing_views FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM public.clothing_listings WHERE seller_id = auth.uid()
    )
  );
