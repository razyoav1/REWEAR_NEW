-- ===========================================================================
-- SHARED WISHLISTS MIGRATION
-- ===========================================================================

-- 1. Add created_by column to wishlists (track original creator)
ALTER TABLE public.wishlists 
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES public.users(id);

-- Backfill created_by_user_id with user_id for existing wishlists
UPDATE public.wishlists 
SET created_by_user_id = user_id 
WHERE created_by_user_id IS NULL;

-- Make created_by_user_id NOT NULL after backfill
ALTER TABLE public.wishlists 
ALTER COLUMN created_by_user_id SET NOT NULL;

-- ===========================================================================
-- 2. Create wishlist_members table
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.wishlist_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_id uuid NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(wishlist_id, user_id)
);

-- Enable RLS
ALTER TABLE public.wishlist_members ENABLE ROW LEVEL SECURITY;

-- Backfill: Add existing wishlist owners as members
INSERT INTO public.wishlist_members (wishlist_id, user_id)
SELECT id, user_id FROM public.wishlists
ON CONFLICT (wishlist_id, user_id) DO NOTHING;

-- ===========================================================================
-- 3. Create wishlist_invites table
-- ===========================================================================
CREATE TYPE public.wishlist_invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired', 'canceled');

CREATE TABLE IF NOT EXISTS public.wishlist_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_id uuid NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  invited_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invited_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status public.wishlist_invite_status NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  -- Prevent duplicate pending/accepted invites to same wishlist
  CONSTRAINT unique_active_invite UNIQUE (wishlist_id, invited_user_id)
);

-- Enable RLS
ALTER TABLE public.wishlist_invites ENABLE ROW LEVEL SECURITY;

-- Add update trigger for updated_at
CREATE TRIGGER update_wishlist_invites_updated_at
  BEFORE UPDATE ON public.wishlist_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================================================
-- 4. Helper function: Check if user is a wishlist member
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.is_wishlist_member(_user_id uuid, _wishlist_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wishlist_members
    WHERE user_id = _user_id AND wishlist_id = _wishlist_id
  )
$$;

-- ===========================================================================
-- 5. Helper function: Check if users can collaborate (not blocked)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.can_collaborate(_user1_id uuid, _user2_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = _user1_id AND blocked_id = _user2_id)
       OR (blocker_id = _user2_id AND blocked_id = _user1_id)
  )
$$;

-- ===========================================================================
-- 6. RLS Policies for wishlist_members
-- ===========================================================================

-- Members can view their own memberships
CREATE POLICY "Users can view their own memberships"
  ON public.wishlist_members FOR SELECT
  USING (auth.uid() = user_id);

-- Members can view other members of wishlists they belong to
CREATE POLICY "Members can view co-members"
  ON public.wishlist_members FOR SELECT
  USING (is_wishlist_member(auth.uid(), wishlist_id));

-- System inserts members (via invites accept or creation)
CREATE POLICY "Users can add themselves as initial member"
  ON public.wishlist_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      -- Either creating membership for their own new wishlist
      EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_id AND created_by_user_id = auth.uid())
      -- Or accepting an invite
      OR EXISTS (
        SELECT 1 FROM public.wishlist_invites 
        WHERE wishlist_id = wishlist_members.wishlist_id 
          AND invited_user_id = auth.uid() 
          AND status = 'accepted'
      )
    )
  );

-- Members can remove others (but not last member)
CREATE POLICY "Members can remove other members"
  ON public.wishlist_members FOR DELETE
  USING (
    is_wishlist_member(auth.uid(), wishlist_id)
    AND (
      -- Can remove self (leave)
      user_id = auth.uid()
      -- Or can remove others
      OR is_wishlist_member(auth.uid(), wishlist_id)
    )
    -- Prevent removing last member
    AND (SELECT COUNT(*) FROM public.wishlist_members WHERE wishlist_id = wishlist_members.wishlist_id) > 1
  );

-- ===========================================================================
-- 7. RLS Policies for wishlist_invites
-- ===========================================================================

-- Invited users can view their pending invites
CREATE POLICY "Users can view invites sent to them"
  ON public.wishlist_invites FOR SELECT
  USING (invited_user_id = auth.uid());

-- Members can view invites for their wishlists
CREATE POLICY "Members can view wishlist invites"
  ON public.wishlist_invites FOR SELECT
  USING (is_wishlist_member(auth.uid(), wishlist_id));

-- Members can create invites (if not blocked)
CREATE POLICY "Members can create invites"
  ON public.wishlist_invites FOR INSERT
  WITH CHECK (
    invited_by_user_id = auth.uid()
    AND is_wishlist_member(auth.uid(), wishlist_id)
    AND can_collaborate(auth.uid(), invited_user_id)
    AND invited_user_id != auth.uid()
    -- Not already a member
    AND NOT is_wishlist_member(invited_user_id, wishlist_id)
  );

-- Invited user can update their own invite (accept/decline)
CREATE POLICY "Invited user can respond to invite"
  ON public.wishlist_invites FOR UPDATE
  USING (invited_user_id = auth.uid())
  WITH CHECK (invited_user_id = auth.uid());

-- Members can cancel invites they sent or any invite for their wishlist
CREATE POLICY "Members can cancel invites"
  ON public.wishlist_invites FOR UPDATE
  USING (
    is_wishlist_member(auth.uid(), wishlist_id)
    AND status = 'pending'
  )
  WITH CHECK (
    is_wishlist_member(auth.uid(), wishlist_id)
  );

-- Members can delete invites for their wishlists
CREATE POLICY "Members can delete invites"
  ON public.wishlist_invites FOR DELETE
  USING (is_wishlist_member(auth.uid(), wishlist_id));

-- ===========================================================================
-- 8. Update wishlists RLS for member-based access
-- ===========================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can create their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can update their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can delete their own wishlists" ON public.wishlists;

-- New policies based on membership
CREATE POLICY "Members can view wishlists"
  ON public.wishlists FOR SELECT
  USING (is_wishlist_member(auth.uid(), id));

CREATE POLICY "Users can create wishlists"
  ON public.wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() = created_by_user_id);

CREATE POLICY "Members can update wishlists"
  ON public.wishlists FOR UPDATE
  USING (is_wishlist_member(auth.uid(), id))
  WITH CHECK (is_wishlist_member(auth.uid(), id));

CREATE POLICY "Members can delete wishlists"
  ON public.wishlists FOR DELETE
  USING (is_wishlist_member(auth.uid(), id));

-- ===========================================================================
-- 9. Update wishlist_items RLS for member-based access
-- ===========================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can create their own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can update their own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can delete their own wishlist items" ON public.wishlist_items;

-- Add added_by_user_id column to track who added each item
ALTER TABLE public.wishlist_items
ADD COLUMN IF NOT EXISTS added_by_user_id uuid REFERENCES public.users(id);

-- Backfill with user_id
UPDATE public.wishlist_items
SET added_by_user_id = user_id
WHERE added_by_user_id IS NULL;

-- New policies based on membership
CREATE POLICY "Members can view wishlist items"
  ON public.wishlist_items FOR SELECT
  USING (is_wishlist_member(auth.uid(), wishlist_id));

CREATE POLICY "Members can add wishlist items"
  ON public.wishlist_items FOR INSERT
  WITH CHECK (
    is_wishlist_member(auth.uid(), wishlist_id)
    AND added_by_user_id = auth.uid()
  );

CREATE POLICY "Members can update wishlist items"
  ON public.wishlist_items FOR UPDATE
  USING (is_wishlist_member(auth.uid(), wishlist_id))
  WITH CHECK (is_wishlist_member(auth.uid(), wishlist_id));

CREATE POLICY "Members can remove wishlist items"
  ON public.wishlist_items FOR DELETE
  USING (is_wishlist_member(auth.uid(), wishlist_id));

-- ===========================================================================
-- 10. Trigger: Auto-remove collaborators when blocked
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.on_block_remove_collaboration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Cancel any pending invites between these users
  UPDATE public.wishlist_invites
  SET status = 'canceled', updated_at = now()
  WHERE status = 'pending'
    AND (
      (invited_user_id = NEW.blocked_id AND invited_by_user_id = NEW.blocker_id)
      OR (invited_user_id = NEW.blocker_id AND invited_by_user_id = NEW.blocked_id)
    );

  -- Remove shared wishlist memberships between these users
  -- Only remove from shared wishlists (wishlists with more than 1 member)
  DELETE FROM public.wishlist_members wm1
  WHERE wm1.user_id IN (NEW.blocker_id, NEW.blocked_id)
    AND EXISTS (
      SELECT 1 FROM public.wishlist_members wm2
      WHERE wm2.wishlist_id = wm1.wishlist_id
        AND wm2.user_id IN (NEW.blocker_id, NEW.blocked_id)
        AND wm2.user_id != wm1.user_id
    )
    -- Only if there are other members remaining (not the blocked pair)
    AND (SELECT COUNT(*) FROM public.wishlist_members WHERE wishlist_id = wm1.wishlist_id) > 2;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_block_remove_collaboration_trigger ON public.blocks;
CREATE TRIGGER on_block_remove_collaboration_trigger
  AFTER INSERT ON public.blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.on_block_remove_collaboration();

-- ===========================================================================
-- 11. Trigger: Auto-add creator as member when wishlist created
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.on_wishlist_created_add_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.wishlist_members (wishlist_id, user_id)
  VALUES (NEW.id, NEW.user_id)
  ON CONFLICT (wishlist_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_wishlist_created_add_member_trigger ON public.wishlists;
CREATE TRIGGER on_wishlist_created_add_member_trigger
  AFTER INSERT ON public.wishlists
  FOR EACH ROW
  EXECUTE FUNCTION public.on_wishlist_created_add_member();