-- ============================================================
-- Security fixes: tighten Notifications RLS + ensure RLS on
-- listing_interactions and recently_seen tables
-- ============================================================

-- ── 1. NOTIFICATIONS ─────────────────────────────────────────
-- The original INSERT policy was too permissive: any authenticated
-- user could insert a notification into any other user's inbox.
-- Replace it with a restrictive policy: users can only insert
-- notifications for themselves (used for local optimistic state),
-- or we drop client-side inserts entirely and rely on DB triggers.

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

-- Only allow a user to insert a notification if they are inserting
-- it for themselves (self-notification), OR if the insert is coming
-- from a Supabase Edge Function / trigger (service role bypasses RLS).
-- For normal client-side app use, notifications should be created by
-- DB triggers only. This policy blocks user-to-user spam injection.
CREATE POLICY "Users can only insert own notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── 2. LISTING_INTERACTIONS ──────────────────────────────────
-- Ensure RLS is enabled and that users can only see their own rows.

ALTER TABLE IF EXISTS public.listing_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own interactions" ON public.listing_interactions;
CREATE POLICY "Users can manage their own interactions"
  ON public.listing_interactions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 3. RECENTLY_SEEN ─────────────────────────────────────────
-- Ensure RLS is enabled and that users can only see/modify their own rows.

ALTER TABLE IF EXISTS public.recently_seen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own recently seen" ON public.recently_seen;
CREATE POLICY "Users can manage their own recently seen"
  ON public.recently_seen
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
