-- Re-apply on_new_review_notify to guarantee live DB uses NEW.text (not NEW.body)
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
