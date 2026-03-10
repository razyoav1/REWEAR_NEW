-- Add 'hidden' to the status values and add timestamp columns
-- The DB doesn't have a CHECK constraint, but we need reserved_at and hidden_at columns

-- Add reserved_at column
ALTER TABLE public.clothing_listings 
ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMP WITH TIME ZONE;

-- Add hidden_at column
ALTER TABLE public.clothing_listings 
ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policies to properly handle visibility rules
-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Public can view available and sold listings" ON public.clothing_listings;
DROP POLICY IF EXISTS "Sellers can view all their own listings" ON public.clothing_listings;

-- Recreate SELECT policies with correct visibility rules:
-- 1. Public can see available, sold, reserved (NOT hidden or deleted)
CREATE POLICY "Public can view available sold reserved listings" 
ON public.clothing_listings 
FOR SELECT 
USING (status IN ('available', 'sold', 'reserved'));

-- 2. Owners can see all their own listings (including hidden and deleted)
CREATE POLICY "Owners can view all their own listings" 
ON public.clothing_listings 
FOR SELECT 
USING (auth.uid() = seller_id);