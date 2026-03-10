-- Enable realtime for clothing_listings status updates
ALTER TABLE public.clothing_listings REPLICA IDENTITY FULL;

-- Add to realtime publication if not already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'clothing_listings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clothing_listings;
  END IF;
END $$;