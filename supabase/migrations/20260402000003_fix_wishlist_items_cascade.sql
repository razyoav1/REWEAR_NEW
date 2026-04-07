-- Fix wishlist_items.added_by_user_id missing ON DELETE SET NULL
-- This was blocking account deletion
ALTER TABLE public.wishlist_items
  DROP CONSTRAINT IF EXISTS wishlist_items_added_by_user_id_fkey;
ALTER TABLE public.wishlist_items
  ADD CONSTRAINT wishlist_items_added_by_user_id_fkey
  FOREIGN KEY (added_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;
