-- Hard delete migration: Add CASCADE to FKs, make conversations.listing_id nullable

-- 1. Drop existing FK on wishlist_items.listing_id and recreate with CASCADE
ALTER TABLE public.wishlist_items 
  DROP CONSTRAINT IF EXISTS wishlist_items_listing_id_fkey;

ALTER TABLE public.wishlist_items 
  ADD CONSTRAINT wishlist_items_listing_id_fkey 
  FOREIGN KEY (listing_id) 
  REFERENCES public.clothing_listings(id) 
  ON DELETE CASCADE;

-- 2. Drop existing FK on listing_interactions.listing_id and recreate with CASCADE
ALTER TABLE public.listing_interactions 
  DROP CONSTRAINT IF EXISTS listing_interactions_listing_id_fkey;

ALTER TABLE public.listing_interactions 
  ADD CONSTRAINT listing_interactions_listing_id_fkey 
  FOREIGN KEY (listing_id) 
  REFERENCES public.clothing_listings(id) 
  ON DELETE CASCADE;

-- 3. Drop existing FK on recently_seen.listing_id and recreate with CASCADE
ALTER TABLE public.recently_seen 
  DROP CONSTRAINT IF EXISTS recently_seen_listing_id_fkey;

ALTER TABLE public.recently_seen 
  ADD CONSTRAINT recently_seen_listing_id_fkey 
  FOREIGN KEY (listing_id) 
  REFERENCES public.clothing_listings(id) 
  ON DELETE CASCADE;

-- 4. Make conversations.listing_id nullable and set to NULL on listing delete
ALTER TABLE public.conversations 
  ALTER COLUMN listing_id DROP NOT NULL;

ALTER TABLE public.conversations 
  DROP CONSTRAINT IF EXISTS conversations_listing_id_fkey;

ALTER TABLE public.conversations 
  ADD CONSTRAINT conversations_listing_id_fkey 
  FOREIGN KEY (listing_id) 
  REFERENCES public.clothing_listings(id) 
  ON DELETE SET NULL;

-- 5. Drop existing FK on reviews.listing_id and recreate with SET NULL (preserve reviews)
ALTER TABLE public.reviews 
  DROP CONSTRAINT IF EXISTS reviews_listing_id_fkey;

ALTER TABLE public.reviews 
  ADD CONSTRAINT reviews_listing_id_fkey 
  FOREIGN KEY (listing_id) 
  REFERENCES public.clothing_listings(id) 
  ON DELETE SET NULL;

-- 6. Drop existing FK on reports.listing_id and recreate with SET NULL (preserve reports)
ALTER TABLE public.reports 
  DROP CONSTRAINT IF EXISTS reports_listing_id_fkey;

ALTER TABLE public.reports 
  ADD CONSTRAINT reports_listing_id_fkey 
  FOREIGN KEY (listing_id) 
  REFERENCES public.clothing_listings(id) 
  ON DELETE SET NULL;