-- Add is_shared column to wishlists table
ALTER TABLE public.wishlists
ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false;
