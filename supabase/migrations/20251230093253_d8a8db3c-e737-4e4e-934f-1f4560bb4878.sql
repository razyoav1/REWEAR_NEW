-- Add tags column to clothing_listings if not exists
ALTER TABLE public.clothing_listings 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create index for faster tag searches
CREATE INDEX IF NOT EXISTS idx_clothing_listings_tags ON public.clothing_listings USING GIN(tags);