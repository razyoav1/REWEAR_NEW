-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Anyone can view available listings" ON public.clothing_listings;
DROP POLICY IF EXISTS "Allow viewing seller's available and sold listings" ON public.clothing_listings;

-- Create single public SELECT policy for available and sold listings
CREATE POLICY "Public can view available and sold listings"
ON public.clothing_listings
FOR SELECT
USING (status IN ('available', 'sold'));

-- Create authenticated SELECT policy for sellers to manage all their own listings
CREATE POLICY "Sellers can view all their own listings"
ON public.clothing_listings
FOR SELECT
TO authenticated
USING (auth.uid() = seller_id);