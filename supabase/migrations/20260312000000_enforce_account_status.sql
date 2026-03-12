-- ===========================================================================
-- ENFORCE ACCOUNT STATUS (suspended / banned)
-- Adds a RESTRICTIVE RLS policy to all key write-heavy tables so that
-- suspended and banned users cannot insert data even if they bypass the UI.
-- Restrictive policies are ANDed with permissive policies — both must pass.
-- ===========================================================================

-- Helper function: returns true only if the calling user's account is active
CREATE OR REPLACE FUNCTION public.is_account_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT account_status = 'active' FROM public.users WHERE id = auth.uid()),
    true  -- if no profile row exists yet (e.g. during onboarding), allow
  )
$$;

-- ── clothing_listings ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Active accounts only: insert listing" ON public.clothing_listings;
CREATE POLICY "Active accounts only: insert listing"
  ON public.clothing_listings AS RESTRICTIVE FOR INSERT
  TO authenticated
  WITH CHECK (public.is_account_active());

-- ── messages ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Active accounts only: insert message" ON public.messages;
CREATE POLICY "Active accounts only: insert message"
  ON public.messages AS RESTRICTIVE FOR INSERT
  TO authenticated
  WITH CHECK (public.is_account_active());

-- ── reviews ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Active accounts only: insert review" ON public.reviews;
CREATE POLICY "Active accounts only: insert review"
  ON public.reviews AS RESTRICTIVE FOR INSERT
  TO authenticated
  WITH CHECK (public.is_account_active());

-- ── wishlist_items ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Active accounts only: insert wishlist item" ON public.wishlist_items;
CREATE POLICY "Active accounts only: insert wishlist item"
  ON public.wishlist_items AS RESTRICTIVE FOR INSERT
  TO authenticated
  WITH CHECK (public.is_account_active());

-- ── wishlists ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Active accounts only: insert wishlist" ON public.wishlists;
CREATE POLICY "Active accounts only: insert wishlist"
  ON public.wishlists AS RESTRICTIVE FOR INSERT
  TO authenticated
  WITH CHECK (public.is_account_active());

-- ── wishlist_invites ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Active accounts only: insert wishlist invite" ON public.wishlist_invites;
CREATE POLICY "Active accounts only: insert wishlist invite"
  ON public.wishlist_invites AS RESTRICTIVE FOR INSERT
  TO authenticated
  WITH CHECK (public.is_account_active());

-- ── reports ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Active accounts only: insert report" ON public.reports;
CREATE POLICY "Active accounts only: insert report"
  ON public.reports AS RESTRICTIVE FOR INSERT
  TO authenticated
  WITH CHECK (public.is_account_active());
