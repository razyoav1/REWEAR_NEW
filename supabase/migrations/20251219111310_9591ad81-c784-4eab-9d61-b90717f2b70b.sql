-- Create clothing_listings table
CREATE TABLE public.clothing_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  brand TEXT,
  size_system TEXT NOT NULL DEFAULT 'US',
  size_value TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('new_with_tags', 'like_new', 'good', 'fair')),
  colors TEXT[] DEFAULT '{}',
  material TEXT,
  measurements JSONB DEFAULT '{}',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  photos TEXT[] DEFAULT '{}',
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sold_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Create index for common queries
CREATE INDEX idx_listings_seller_id ON public.clothing_listings(seller_id);
CREATE INDEX idx_listings_status ON public.clothing_listings(status);
CREATE INDEX idx_listings_category ON public.clothing_listings(category);
CREATE INDEX idx_listings_created_at ON public.clothing_listings(created_at DESC);
CREATE INDEX idx_listings_location ON public.clothing_listings(location_lat, location_lng);

-- Enable RLS
ALTER TABLE public.clothing_listings ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Anyone can view available listings
CREATE POLICY "Anyone can view available listings"
ON public.clothing_listings
FOR SELECT
USING (status = 'available');

-- SELECT policy: Allow viewing sold listings when querying by seller_id (for profile pages)
CREATE POLICY "Allow viewing seller's available and sold listings"
ON public.clothing_listings
FOR SELECT
USING (
  status IN ('available', 'sold') 
  AND seller_id IS NOT NULL
);

-- INSERT policy: Only authenticated users can create their own listings
CREATE POLICY "Users can create their own listings"
ON public.clothing_listings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = seller_id);

-- UPDATE policy: Only owner can update their listings
CREATE POLICY "Users can update their own listings"
ON public.clothing_listings
FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- Trigger for updated_at
CREATE TRIGGER update_clothing_listings_updated_at
  BEFORE UPDATE ON public.clothing_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create listing-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-photos', 'listing-photos', true);

-- Storage policies for listing-photos
-- Anyone can view listing photos (public bucket)
CREATE POLICY "Anyone can view listing photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'listing-photos');

-- Authenticated users can upload their own listing photos
CREATE POLICY "Users can upload their own listing photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own listing photos
CREATE POLICY "Users can update their own listing photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listing-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own listing photos
CREATE POLICY "Users can delete their own listing photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);