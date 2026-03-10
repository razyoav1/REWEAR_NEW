-- Drop the existing check constraint and recreate with all valid statuses
ALTER TABLE public.clothing_listings DROP CONSTRAINT IF EXISTS clothing_listings_status_check;

ALTER TABLE public.clothing_listings ADD CONSTRAINT clothing_listings_status_check 
CHECK (status IN ('available', 'reserved', 'sold', 'hidden', 'deleted'));