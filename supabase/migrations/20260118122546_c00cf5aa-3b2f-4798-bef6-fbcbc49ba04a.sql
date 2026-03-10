-- The issue: when creating a wishlist, the .select() call fails because 
-- the user isn't a member yet (trigger adds them AFTER insert).
-- Solution: Add a SELECT policy that allows creators to see their own row immediately.

-- Drop and recreate the SELECT policy to include creator access
DROP POLICY IF EXISTS "Members can view wishlists" ON public.wishlists;

CREATE POLICY "Members and creators can view wishlists" 
ON public.wishlists 
FOR SELECT 
USING (
  is_wishlist_member(auth.uid(), id) 
  OR created_by_user_id = auth.uid()
);