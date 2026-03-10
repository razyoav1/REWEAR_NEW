-- Add conversation_id to reports table for conversation reports
ALTER TABLE public.reports 
ADD COLUMN conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL;

-- Add index for conversation reports
CREATE INDEX idx_reports_conversation_id ON public.reports(conversation_id) WHERE conversation_id IS NOT NULL;