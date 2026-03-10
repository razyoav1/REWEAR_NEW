-- 1. Update is_user_blocked to check both directions (symmetric blocking)
CREATE OR REPLACE FUNCTION public.is_user_blocked(_blocker_id uuid, _blocked_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = _blocker_id AND blocked_id = _blocked_id)
       OR (blocker_id = _blocked_id AND blocked_id = _blocker_id)
  )
$$;

-- 2. Add indexes for faster block lookups
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON public.blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_blocked ON public.blocks(blocker_id, blocked_id);

-- 3. Update clothing_listings SELECT policies to exclude blocked users
-- First drop existing public policy
DROP POLICY IF EXISTS "Public can view available sold reserved listings" ON public.clothing_listings;

-- Create new policy that excludes blocked sellers
CREATE POLICY "Public can view available sold reserved listings" 
ON public.clothing_listings 
FOR SELECT 
USING (
  status IN ('available', 'sold', 'reserved')
  AND (
    auth.uid() IS NULL -- Allow anonymous users (they have no blocks)
    OR NOT public.is_user_blocked(auth.uid(), seller_id)
  )
);

-- 4. Update messages INSERT policy to prevent messaging blocked users
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;

CREATE POLICY "Participants can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  (auth.uid() = sender_id) 
  AND is_conversation_participant(auth.uid(), conversation_id) 
  AND NOT EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.is_disabled = true
  )
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.account_status = 'active'
  )
  -- Block enforcement: check if sender is blocked by other participant
  AND NOT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND public.is_user_blocked(
      auth.uid(), 
      CASE WHEN c.buyer_id = auth.uid() THEN c.seller_id ELSE c.buyer_id END
    )
  )
);

-- 5. Update follows INSERT policy to prevent following blocked users
DROP POLICY IF EXISTS "Users can create their own follows" ON public.follows;

CREATE POLICY "Users can create their own follows" 
ON public.follows 
FOR INSERT 
WITH CHECK (
  auth.uid() = follower_id
  AND NOT public.is_user_blocked(follower_id, following_id)
);

-- 6. Update reviews INSERT policy to prevent reviewing blocked users
DROP POLICY IF EXISTS "Users can create reviews after interaction" ON public.reviews;

CREATE POLICY "Users can create reviews after interaction" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  (auth.uid() = reviewer_id) 
  AND (reviewer_id <> reviewee_id) 
  AND can_review(reviewer_id, reviewee_id)
  AND NOT public.is_user_blocked(reviewer_id, reviewee_id)
);

-- 7. Create trigger to remove follows in both directions when block is created
CREATE OR REPLACE FUNCTION public.on_block_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove any existing follows between these two users in both directions
  DELETE FROM public.follows
  WHERE (follower_id = NEW.blocker_id AND following_id = NEW.blocked_id)
     OR (follower_id = NEW.blocked_id AND following_id = NEW.blocker_id);
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_block_created_trigger ON public.blocks;
CREATE TRIGGER on_block_created_trigger
  AFTER INSERT ON public.blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.on_block_created();

-- 8. Add RLS policy for admins to manage blocks (for force-block functionality)
DROP POLICY IF EXISTS "Admins can view all blocks" ON public.blocks;
CREATE POLICY "Admins can view all blocks" 
ON public.blocks 
FOR SELECT 
USING (is_admin());

DROP POLICY IF EXISTS "Admins can create blocks" ON public.blocks;
CREATE POLICY "Admins can create blocks" 
ON public.blocks 
FOR INSERT 
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete blocks" ON public.blocks;
CREATE POLICY "Admins can delete blocks" 
ON public.blocks 
FOR DELETE 
USING (is_admin());