-- Allow admins to view ALL listings regardless of status
CREATE POLICY "Admins can view all listings" 
ON public.clothing_listings 
FOR SELECT 
USING (is_admin());

-- Allow admins to update any listing (for moderation)
CREATE POLICY "Admins can update any listing" 
ON public.clothing_listings 
FOR UPDATE 
USING (is_admin());