-- ===========================================================================
-- PRICE DROP NOTIFICATIONS
-- DB trigger: when a listing's price decreases, notify all users who have
-- that listing saved in any wishlist.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.on_listing_price_drop()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Guard: only fire when price actually dropped
  IF NEW.price >= OLD.price THEN
    RETURN NEW;
  END IF;

  -- Notify each unique user who has this listing wishlisted (excluding the seller)
  FOR rec IN
    SELECT DISTINCT user_id
    FROM public.wishlist_items
    WHERE listing_id = NEW.id
      AND user_id != NEW.seller_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      rec.user_id,
      'listing_price_drop',
      'Price drop on a saved item',
      NEW.title || ' dropped to ' || NEW.currency || ' ' || ROUND(NEW.price::numeric, 2)::text,
      jsonb_build_object(
        'listing_id',    NEW.id,
        'listing_title', NEW.title,
        'old_price',     OLD.price,
        'new_price',     NEW.price,
        'currency',      NEW.currency
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_listing_price_drop_trigger ON public.clothing_listings;
CREATE TRIGGER on_listing_price_drop_trigger
  AFTER UPDATE ON public.clothing_listings
  FOR EACH ROW
  WHEN (NEW.price < OLD.price)
  EXECUTE FUNCTION public.on_listing_price_drop();
