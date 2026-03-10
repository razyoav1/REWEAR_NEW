-- Create enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create admin_audit_log table
CREATE TABLE public.admin_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id uuid NOT NULL REFERENCES public.users(id),
    action_type text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    old_value jsonb,
    new_value jsonb,
    note text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on admin_audit_log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view/insert audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (public.is_admin() AND admin_user_id = auth.uid());

-- Add status column to reports table
ALTER TABLE public.reports 
ADD COLUMN status text NOT NULL DEFAULT 'open' 
CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed'));

ALTER TABLE public.reports
ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.reports
ADD COLUMN resolution_note text;

-- Add RLS policies for admins to manage reports
CREATE POLICY "Admins can view all reports"
ON public.reports
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update reports"
ON public.reports
FOR UPDATE
USING (public.is_admin());

-- Add account_status to users table
ALTER TABLE public.users
ADD COLUMN account_status text NOT NULL DEFAULT 'active'
CHECK (account_status IN ('active', 'suspended', 'banned'));

-- Add is_disabled to conversations table
ALTER TABLE public.conversations
ADD COLUMN is_disabled boolean NOT NULL DEFAULT false;

-- Add is_hidden to reviews table
ALTER TABLE public.reviews
ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;

-- Update RLS for messages to check conversation is_disabled
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
    (auth.uid() = sender_id) 
    AND is_conversation_participant(auth.uid(), conversation_id)
    AND NOT EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = conversation_id AND is_disabled = true
    )
);

-- Update RLS for clothing_listings to check account_status for inserts
DROP POLICY IF EXISTS "Users can create their own listings" ON public.clothing_listings;
CREATE POLICY "Users can create their own listings"
ON public.clothing_listings
FOR INSERT
WITH CHECK (
    auth.uid() = seller_id
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND account_status = 'active'
    )
);

-- Add indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_entity ON public.admin_audit_log(entity_type, entity_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_users_account_status ON public.users(account_status);

-- Update rating function to exclude hidden reviews
CREATE OR REPLACE FUNCTION public.update_user_rating_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update reviewee's rating stats (excluding hidden reviews)
  UPDATE public.users
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2)
      FROM public.reviews
      WHERE reviewee_id = COALESCE(NEW.reviewee_id, OLD.reviewee_id)
      AND is_hidden = false
    ), 0),
    rating_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE reviewee_id = COALESCE(NEW.reviewee_id, OLD.reviewee_id)
      AND is_hidden = false
    )
  WHERE id = COALESCE(NEW.reviewee_id, OLD.reviewee_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add trigger for rating updates on review hide/show
DROP TRIGGER IF EXISTS update_reviews_rating ON public.reviews;
CREATE TRIGGER update_reviews_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_user_rating_stats();

-- Trigger for reports updated_at
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();