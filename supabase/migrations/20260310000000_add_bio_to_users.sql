-- Add bio column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
