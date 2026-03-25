-- ===========================================================================
-- NOTIFICATIONS SYSTEM
-- ===========================================================================

-- 1. Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  data jsonb NOT NULL DEFAULT '{}',
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can mark their own notifications read
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Any authenticated user can insert a notification (permissive for MVP;
-- in production replace with a Supabase Edge Function)
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (is_admin());

-- ===========================================================================
-- 2. DB Trigger: message_received
-- Fires when a new message is inserted → notifies the other participant
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.on_new_message_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.conversations%ROWTYPE;
  v_sender_name text;
  v_listing_title text;
  v_recipient_id uuid;
BEGIN
  SELECT * INTO v_conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Determine recipient
  v_recipient_id := CASE
    WHEN v_conv.buyer_id = NEW.sender_id THEN v_conv.seller_id
    ELSE v_conv.buyer_id
  END;

  SELECT name INTO v_sender_name FROM public.users WHERE id = NEW.sender_id;

  IF v_conv.listing_id IS NOT NULL THEN
    SELECT title INTO v_listing_title
    FROM public.clothing_listings WHERE id = v_conv.listing_id;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    v_recipient_id,
    'message_received',
    COALESCE(v_sender_name, 'Someone') || ' sent you a message',
    CASE
      WHEN v_listing_title IS NOT NULL THEN 'Re: ' || v_listing_title || ' — ' || LEFT(NEW.body, 50)
      ELSE LEFT(NEW.body, 80)
    END,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id,
      'sender_name', COALESCE(v_sender_name, 'Someone'),
      'listing_title', v_listing_title
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_message_notify_trigger ON public.messages;
CREATE TRIGGER on_new_message_notify_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.on_new_message_notify();

-- ===========================================================================
-- 3. DB Trigger: review_received
-- Fires when a new review is inserted → notifies the reviewee
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.on_new_review_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reviewer_name text;
BEGIN
  SELECT name INTO v_reviewer_name FROM public.users WHERE id = NEW.reviewer_id;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    NEW.reviewee_id,
    'review_received',
    COALESCE(v_reviewer_name, 'Someone') || ' left you a review',
    NEW.rating::text || '★ — ' || COALESCE(LEFT(NEW.text, 60), 'No comment'),
    jsonb_build_object(
      'reviewer_id', NEW.reviewer_id,
      'reviewer_name', COALESCE(v_reviewer_name, 'Someone'),
      'rating', NEW.rating,
      'listing_id', NEW.listing_id
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_review_notify_trigger ON public.reviews;
CREATE TRIGGER on_new_review_notify_trigger
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.on_new_review_notify();
