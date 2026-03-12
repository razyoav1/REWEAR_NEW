-- Add last_seen_at column to users table for activity indicator
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
