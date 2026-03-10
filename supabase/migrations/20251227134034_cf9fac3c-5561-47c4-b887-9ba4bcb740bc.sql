-- Make size_value optional and description required
ALTER TABLE public.clothing_listings 
  ALTER COLUMN size_value DROP NOT NULL,
  ALTER COLUMN description SET NOT NULL;

-- Set a default for size_value for existing null cases (if any)
ALTER TABLE public.clothing_listings 
  ALTER COLUMN size_value SET DEFAULT '';