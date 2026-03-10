-- Function to check if user can review (has had a conversation with reviewee)
CREATE OR REPLACE FUNCTION public.can_review(reviewer_id uuid, reviewee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE 
      (buyer_id = reviewer_id AND seller_id = reviewee_id)
      OR (buyer_id = reviewee_id AND seller_id = reviewer_id)
  )
$$;

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update their own reviews within 1 month" ON public.reviews;

-- Create new UPDATE policy with 7-day window
CREATE POLICY "Users can update their own reviews within 7 days" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = reviewer_id AND created_at > (now() - interval '7 days'))
WITH CHECK (auth.uid() = reviewer_id);

-- Add DELETE policy for reviewer only
CREATE POLICY "Users can delete their own reviews" 
ON public.reviews 
FOR DELETE 
USING (auth.uid() = reviewer_id);

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;

-- Create new INSERT policy with interaction gating
CREATE POLICY "Users can create reviews after interaction" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id 
  AND reviewer_id <> reviewee_id 
  AND public.can_review(reviewer_id, reviewee_id)
);