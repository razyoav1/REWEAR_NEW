-- Add review_id column to reports table for reporting reviews
ALTER TABLE public.reports
ADD COLUMN review_id uuid REFERENCES public.reviews(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_reports_review_id ON public.reports(review_id) WHERE review_id IS NOT NULL;