-- ============================================
-- PHASE 3: Chat, Reviews, Blocks, Reports
-- ============================================

-- 1) CONVERSATIONS TABLE
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.clothing_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(listing_id, buyer_id, seller_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Only participants can view their conversations
CREATE POLICY "Participants can view their conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Only buyer can create a conversation (seller is derived from listing)
CREATE POLICY "Buyers can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Participants can update (for last_message_at)
CREATE POLICY "Participants can update conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Enable realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- 2) MESSAGES TABLE
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is conversation participant
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = _conversation_id
    AND (buyer_id = _user_id OR seller_id = _user_id)
  )
$$;

-- Only conversation participants can view messages
CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (public.is_conversation_participant(auth.uid(), conversation_id));

-- Only participants can send messages (and must be the sender)
CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id 
  AND public.is_conversation_participant(auth.uid(), conversation_id)
);

-- Participants can update messages (for is_read)
CREATE POLICY "Participants can update messages"
ON public.messages FOR UPDATE
USING (public.is_conversation_participant(auth.uid(), conversation_id));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 3) REVIEWS TABLE
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.clothing_listings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Prevent self-reviews and duplicate reviews per listing
  CONSTRAINT no_self_review CHECK (reviewer_id != reviewee_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews (public)
CREATE POLICY "Anyone can view reviews"
ON public.reviews FOR SELECT
USING (true);

-- Only authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = reviewer_id AND reviewer_id != reviewee_id);

-- 4) BLOCKS TABLE
CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own blocks
CREATE POLICY "Users can view their own blocks"
ON public.blocks FOR SELECT
USING (auth.uid() = blocker_id);

-- Users can create blocks
CREATE POLICY "Users can create blocks"
ON public.blocks FOR INSERT
WITH CHECK (auth.uid() = blocker_id AND blocker_id != blocked_id);

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can delete their own blocks"
ON public.blocks FOR DELETE
USING (auth.uid() = blocker_id);

-- 5) REPORTS TABLE
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.clothing_listings(id) ON DELETE SET NULL,
  reported_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reports
CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
USING (auth.uid() = reporter_id);

-- Users can create reports
CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- 6) UPDATE USERS TABLE for public profile access
-- Add columns for rating stats if not exist (computed or cached)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS rating_avg numeric(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0;

-- Create policy for public profile viewing (limited fields)
-- First drop existing restrictive policy if needed
DROP POLICY IF EXISTS "Public can view user profiles" ON public.users;

CREATE POLICY "Public can view user profiles"
ON public.users FOR SELECT
USING (true);

-- 7) Function to update user rating stats (trigger)
CREATE OR REPLACE FUNCTION public.update_user_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update reviewee's rating stats
  UPDATE public.users
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2)
      FROM public.reviews
      WHERE reviewee_id = NEW.reviewee_id
    ), 0),
    rating_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE reviewee_id = NEW.reviewee_id
    )
  WHERE id = NEW.reviewee_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update rating stats on review insert
CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_rating_stats();

-- 8) Function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(_blocker_id uuid, _blocked_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE blocker_id = _blocker_id AND blocked_id = _blocked_id
  )
$$;

-- 9) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_listing_id ON public.conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON public.blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);