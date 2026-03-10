-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_review_created ON public.reviews;

-- Recreate trigger to also fire on UPDATE
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_rating_stats();