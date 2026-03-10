-- Add unique constraint: one review per reviewer-reviewee pair
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_reviewer_reviewee_unique UNIQUE (reviewer_id, reviewee_id);

-- Allow users to update their own reviews within 1 month
CREATE POLICY "Users can update their own reviews within 1 month" 
ON public.reviews 
FOR UPDATE 
USING (
  auth.uid() = reviewer_id 
  AND created_at > (now() - interval '1 month')
)
WITH CHECK (
  auth.uid() = reviewer_id
);