-- Drop the existing check constraint and recreate it to allow 'none'
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_location_precision_check;

ALTER TABLE public.users ADD CONSTRAINT users_location_precision_check 
CHECK (location_precision IS NULL OR location_precision IN ('precise', 'approximate', 'none'));