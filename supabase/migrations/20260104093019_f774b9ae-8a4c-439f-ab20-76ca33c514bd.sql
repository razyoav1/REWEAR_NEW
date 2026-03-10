-- Add admin policy to update any user (for suspend/ban actions)
CREATE POLICY "Admins can update any user"
ON public.users
FOR UPDATE
USING (is_admin());

-- Add suspension_reason column to store admin's reason
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Add suspension_at timestamp to track when user was suspended/banned
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone;