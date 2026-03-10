-- Create follows table for the follow system
CREATE TABLE public.follows (
  follower_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

-- Create indexes for efficient lookups
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- Any authenticated user can view follows (needed for follower lists)
CREATE POLICY "Authenticated users can view follows"
ON public.follows
FOR SELECT
TO authenticated
USING (true);

-- Users can only follow (insert) as themselves
CREATE POLICY "Users can create their own follows"
ON public.follows
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

-- Users can only unfollow (delete) their own follows
CREATE POLICY "Users can delete their own follows"
ON public.follows
FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);